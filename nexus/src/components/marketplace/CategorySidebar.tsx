/**
 * CategorySidebar Component
 *
 * Category navigation sidebar for the marketplace.
 * Features collapsible subcategories, active state highlighting, and count badges.
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  getCategories,
  getCategoryBgClass,
  getCategoryTextClass,
  getCategoryStats,
  CATEGORY_IDS,
} from '@/lib/marketplace'
import type { Category, CategoryId } from '@/lib/marketplace'

// =============================================================================
// TYPES
// =============================================================================

interface CategorySidebarProps {
  /** Currently selected category */
  selectedCategory: CategoryId | null
  /** Callback when category is selected */
  onSelectCategory: (categoryId: CategoryId) => void
  /** Template data for calculating counts */
  templates?: Array<{ category: string; rating?: number; id: string }>
  /** Show category counts */
  showCounts?: boolean
  /** Compact mode for mobile */
  compact?: boolean
  /** Custom class name */
  className?: string
}

interface CategoryItemProps {
  category: Category
  isSelected: boolean
  count: number
  onSelect: (categoryId: CategoryId) => void
  compact: boolean
  hasSubcategories: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

function CategoryItem({
  category,
  isSelected,
  count,
  onSelect,
  compact,
  hasSubcategories,
  isExpanded,
  onToggleExpand,
}: CategoryItemProps) {
  const handleClick = useCallback(() => {
    onSelect(category.id)
  }, [category.id, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(category.id)
      } else if (e.key === 'ArrowRight' && hasSubcategories && !isExpanded) {
        e.preventDefault()
        onToggleExpand()
      } else if (e.key === 'ArrowLeft' && hasSubcategories && isExpanded) {
        e.preventDefault()
        onToggleExpand()
      }
    },
    [category.id, onSelect, hasSubcategories, isExpanded, onToggleExpand]
  )

  const handleExpandClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleExpand()
    },
    [onToggleExpand]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200',
        'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
        isSelected && [
          'bg-primary/10',
          getCategoryBgClass(category.id),
          'ring-1 ring-primary/30',
        ],
        compact && 'px-2 py-2'
      )}
      aria-selected={isSelected}
      aria-expanded={hasSubcategories ? isExpanded : undefined}
    >
      {/* Category Icon */}
      <span
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg text-lg transition-transform',
          isSelected && getCategoryBgClass(category.id),
          !isSelected && 'group-hover:scale-110'
        )}
        aria-hidden="true"
      >
        {category.icon}
      </span>

      {/* Category Label */}
      {!compact && (
        <span
          className={cn(
            'flex-1 text-sm font-medium transition-colors',
            isSelected ? getCategoryTextClass(category.id) : 'text-foreground/80',
            'group-hover:text-foreground'
          )}
        >
          {category.label}
        </span>
      )}

      {/* Count Badge */}
      {!compact && count > 0 && (
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded-full transition-colors',
            isSelected
              ? [getCategoryBgClass(category.id), getCategoryTextClass(category.id)]
              : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}

      {/* Expand/Collapse Button */}
      {!compact && hasSubcategories && (
        <button
          onClick={handleExpandClick}
          className={cn(
            'p-1 rounded hover:bg-accent transition-transform',
            isExpanded && 'rotate-90'
          )}
          aria-label={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
        >
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

function SubcategoryItem({
  subcategory,
  isSelected,
  onSelect,
}: {
  subcategory: Category
  isSelected: boolean
  onSelect: (categoryId: CategoryId) => void
}) {
  const handleClick = useCallback(() => {
    onSelect(subcategory.id)
  }, [subcategory.id, onSelect])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 ml-8 rounded-lg cursor-pointer transition-all',
        'hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary/30',
        isSelected && 'bg-accent/50'
      )}
    >
      <span className="text-sm" aria-hidden="true">
        {subcategory.icon}
      </span>
      <span
        className={cn(
          'text-sm',
          isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}
      >
        {subcategory.label}
      </span>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  templates = [],
  showCounts = true,
  compact = false,
  className,
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryId>>(
    new Set()
  )

  // Get categories
  const categories = useMemo(() => getCategories(), [])

  // Calculate category stats
  const categoryStats = useMemo(() => {
    if (!showCounts || templates.length === 0) {
      return new Map<CategoryId, number>()
    }

    const stats = getCategoryStats(templates)
    return new Map(stats.map((s) => [s.categoryId, s.count]))
  }, [templates, showCounts])

  // Toggle expanded state
  const toggleExpanded = useCallback((categoryId: CategoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  // Separate special categories from main categories
  const { specialCategories, mainCategories } = useMemo(() => {
    const special: CategoryId[] = [CATEGORY_IDS.ALL, CATEGORY_IDS.FAVORITES, CATEGORY_IDS.CUSTOM]
    return {
      specialCategories: categories.filter((c) => special.includes(c.id)),
      mainCategories: categories.filter((c) => !special.includes(c.id)),
    }
  }, [categories])

  return (
    <nav
      className={cn(
        'flex flex-col gap-1 p-2',
        compact ? 'w-14' : 'w-64',
        className
      )}
      aria-label="Template categories"
    >
      {/* Special Categories (All, Favorites, Custom) */}
      <div className="mb-2 pb-2 border-b border-border">
        {specialCategories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            count={categoryStats.get(category.id) || 0}
            onSelect={onSelectCategory}
            compact={compact}
            hasSubcategories={false}
            isExpanded={false}
            onToggleExpand={() => {}}
          />
        ))}
      </div>

      {/* Section Label */}
      {!compact && (
        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Categories
        </div>
      )}

      {/* Main Categories */}
      <div className="flex flex-col gap-0.5">
        {mainCategories.map((category) => {
          const hasSubcategories =
            category.subcategories && category.subcategories.length > 0
          const isExpanded = expandedCategories.has(category.id)

          return (
            <div key={category.id}>
              <CategoryItem
                category={category}
                isSelected={selectedCategory === category.id}
                count={categoryStats.get(category.id) || 0}
                onSelect={onSelectCategory}
                compact={compact}
                hasSubcategories={hasSubcategories || false}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpanded(category.id)}
              />

              {/* Subcategories */}
              {!compact && hasSubcategories && isExpanded && (
                <div className="mt-1 mb-2 animate-in slide-in-from-top-2 duration-200">
                  {category.subcategories?.map((sub) => (
                    <SubcategoryItem
                      key={`${category.id}-${sub.label}`}
                      subcategory={sub}
                      isSelected={false}
                      onSelect={onSelectCategory}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Compact Mode Tooltip Hint */}
      {compact && (
        <div className="mt-auto pt-2 border-t border-border">
          <div
            className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Expand sidebar"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      )}
    </nav>
  )
}

export default CategorySidebar

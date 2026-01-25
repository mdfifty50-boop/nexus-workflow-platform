/**
 * FilterPanel Component
 *
 * Advanced filtering panel for marketplace templates.
 * Includes price range slider, rating filter, tag selection, and active filters summary.
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  PRICE_TIERS,
  CREATOR_TYPES,
  SORT_OPTIONS,
  hasActiveFilters,
  countActiveFilters,
  removeFilterValue,
  resetFilter,
  getPopularTags,
} from '@/lib/marketplace'
import type { FilterState, SortOption, Tag } from '@/lib/marketplace'

// =============================================================================
// TYPES
// =============================================================================

interface FilterPanelProps {
  /** Current filter state */
  filter: FilterState
  /** Callback when filter changes */
  onFilterChange: (filter: FilterState) => void
  /** Available tags to show */
  availableTags?: Tag[]
  /** Available integrations */
  availableIntegrations?: string[]
  /** Collapsible sections */
  collapsible?: boolean
  /** Custom class name */
  className?: string
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RATING_OPTIONS = [
  { value: 4.5, label: '4.5+', stars: 5 },
  { value: 4.0, label: '4.0+', stars: 4 },
  { value: 3.5, label: '3.5+', stars: 3 },
  { value: 3.0, label: '3.0+', stars: 3 },
  { value: null, label: 'Any', stars: 0 },
]

const SORT_DISPLAY: Record<SortOption, string> = {
  [SORT_OPTIONS.POPULARITY]: 'Most Popular',
  [SORT_OPTIONS.RATING]: 'Highest Rated',
  [SORT_OPTIONS.NEWEST]: 'Newest First',
  [SORT_OPTIONS.MOST_USED]: 'Most Used',
  [SORT_OPTIONS.TIME_SAVED]: 'Time Saved',
  [SORT_OPTIONS.NAME_ASC]: 'Name (A-Z)',
  [SORT_OPTIONS.NAME_DESC]: 'Name (Z-A)',
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

function FilterSection({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setIsExpanded((prev) => !prev)
    }
  }, [collapsible])

  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-between w-full text-left mb-3',
          collapsible && 'cursor-pointer hover:text-primary'
        )}
        disabled={!collapsible}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {collapsible && (
          <svg
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>
      {(!collapsible || isExpanded) && (
        <div className="animate-in slide-in-from-top-2 duration-200">{children}</div>
      )}
    </div>
  )
}

function StarRating({
  rating,
  size = 'sm',
}: {
  rating: number
  size?: 'sm' | 'md'
}) {
  const stars = Math.floor(rating)
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={cn(
            sizeClass,
            i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

/**
 * RangeSlider component - kept for future use with price range filtering
 * @internal - exported for potential future use
 */
export function RangeSlider({
  min,
  max,
  value,
  onChange,
  formatLabel,
}: {
  min: number
  max: number
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
  formatLabel?: (value: number) => string
}) {
  const format = formatLabel || ((v) => v.toString())

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = parseInt(e.target.value, 10)
      onChange({
        min: Math.min(newMin, value.max),
        max: value.max,
      })
    },
    [onChange, value.max]
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = parseInt(e.target.value, 10)
      onChange({
        min: value.min,
        max: Math.max(newMax, value.min),
      })
    },
    [onChange, value.min]
  )

  const minPercent = ((value.min - min) / (max - min)) * 100
  const maxPercent = ((value.max - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      {/* Value Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{format(value.min)}</span>
        <span className="text-muted-foreground">to</span>
        <span className="text-muted-foreground">{format(value.max)}</span>
      </div>

      {/* Slider Track */}
      <div className="relative h-2 bg-muted rounded-full">
        {/* Active Range */}
        <div
          className="absolute h-full bg-primary/50 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min Slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={value.min}
          onChange={handleMinChange}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />

        {/* Max Slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={value.max}
          onChange={handleMaxChange}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    </div>
  )
}

function TagChip({
  tag,
  isSelected,
  onToggle,
}: {
  tag: Tag
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {tag.name}
      {isSelected && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  )
}

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 hover:bg-primary/20 rounded-full"
        aria-label={`Remove filter: ${label}`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </span>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FilterPanel({
  filter,
  onFilterChange,
  availableTags,
  // availableIntegrations kept for future integration filter feature
  availableIntegrations: _availableIntegrations = [],
  collapsible = false,
  className,
}: FilterPanelProps) {
  // Suppress unused variable warning - kept for future use
  void _availableIntegrations
  // Get popular tags if not provided
  const tags = useMemo(() => {
    return availableTags || getPopularTags(15)
  }, [availableTags])

  // Check if any filters are active
  const isFiltered = useMemo(() => hasActiveFilters(filter), [filter])
  const filterCount = useMemo(() => countActiveFilters(filter), [filter])

  // Handle price tier change
  const handlePriceTierChange = useCallback(
    (tier: typeof filter.priceTier) => {
      onFilterChange({ ...filter, priceTier: tier })
    },
    [filter, onFilterChange]
  )

  // Handle rating change
  const handleRatingChange = useCallback(
    (rating: number | null) => {
      onFilterChange({ ...filter, rating })
    },
    [filter, onFilterChange]
  )

  // Handle sort change
  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filter, sortBy: e.target.value as SortOption })
    },
    [filter, onFilterChange]
  )

  // Handle tag toggle
  const handleTagToggle = useCallback(
    (tagSlug: string) => {
      const newTags = filter.tags.includes(tagSlug)
        ? filter.tags.filter((t) => t !== tagSlug)
        : [...filter.tags, tagSlug]
      onFilterChange({ ...filter, tags: newTags })
    },
    [filter, onFilterChange]
  )

  // Handle feature toggle
  const handleFeatureToggle = useCallback(
    (feature: 'isPremium' | 'isFeatured' | 'isNew') => {
      const currentValue = filter.features[feature]
      const newValue = currentValue === true ? null : true
      onFilterChange({
        ...filter,
        features: { ...filter.features, [feature]: newValue },
      })
    },
    [filter, onFilterChange]
  )

  // Handle creator type change
  const handleCreatorTypeChange = useCallback(
    (type: typeof filter.creatorType) => {
      onFilterChange({ ...filter, creatorType: type })
    },
    [filter, onFilterChange]
  )

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    onFilterChange(resetFilter())
  }, [onFilterChange])

  // Handle remove specific filter
  const handleRemoveFilter = useCallback(
    (type: Parameters<typeof removeFilterValue>[1], value?: string) => {
      onFilterChange(removeFilterValue(filter, type, value))
    },
    [filter, onFilterChange]
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Active Filters Summary */}
      {isFiltered && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Active Filters ({filterCount})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs h-7"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filter.tags.map((tag) => (
              <ActiveFilterChip
                key={tag}
                label={`Tag: ${tag}`}
                onRemove={() => handleRemoveFilter('tags', tag)}
              />
            ))}
            {filter.rating !== null && (
              <ActiveFilterChip
                label={`${filter.rating}+ stars`}
                onRemove={() => handleRemoveFilter('rating')}
              />
            )}
            {filter.priceTier !== PRICE_TIERS.ALL && (
              <ActiveFilterChip
                label={filter.priceTier}
                onRemove={() => handleRemoveFilter('priceTier')}
              />
            )}
            {filter.features.isPremium !== null && (
              <ActiveFilterChip
                label={filter.features.isPremium ? 'Premium' : 'Free'}
                onRemove={() => handleRemoveFilter('feature', 'premium')}
              />
            )}
            {filter.features.isFeatured && (
              <ActiveFilterChip
                label="Featured"
                onRemove={() => handleRemoveFilter('feature', 'featured')}
              />
            )}
            {filter.features.isNew && (
              <ActiveFilterChip
                label="New"
                onRemove={() => handleRemoveFilter('feature', 'new')}
              />
            )}
          </div>
        </div>
      )}

      {/* Sort By */}
      <FilterSection title="Sort By" collapsible={collapsible}>
        <select
          value={filter.sortBy}
          onChange={handleSortChange}
          className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Object.entries(SORT_DISPLAY).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Price Tier */}
      <FilterSection title="Price" collapsible={collapsible}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRICE_TIERS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePriceTierChange(value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                filter.priceTier === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {key === 'ALL' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="Minimum Rating" collapsible={collapsible}>
        <div className="space-y-2">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleRatingChange(option.value)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-md transition-all',
                filter.rating === option.value
                  ? 'bg-primary/10 ring-1 ring-primary'
                  : 'hover:bg-accent'
              )}
            >
              {option.value !== null && <StarRating rating={option.value} />}
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Tags Multi-Select */}
      <FilterSection title="Tags" collapsible={collapsible} defaultExpanded={false}>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 15).map((tag) => (
            <TagChip
              key={tag.slug}
              tag={tag}
              isSelected={filter.tags.includes(tag.slug)}
              onToggle={() => handleTagToggle(tag.slug)}
            />
          ))}
        </div>
        {tags.length > 15 && (
          <button className="mt-2 text-xs text-primary hover:underline">
            Show more tags...
          </button>
        )}
      </FilterSection>

      {/* Feature Toggles */}
      <FilterSection title="Features" collapsible={collapsible}>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.features.isFeatured === true}
              onChange={() => handleFeatureToggle('isFeatured')}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm">Featured templates</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.features.isNew === true}
              onChange={() => handleFeatureToggle('isNew')}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm">New templates</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.features.isPremium === true}
              onChange={() => handleFeatureToggle('isPremium')}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm">Premium only</span>
          </label>
        </div>
      </FilterSection>

      {/* Creator Type */}
      <FilterSection title="Creator" collapsible={collapsible} defaultExpanded={false}>
        <div className="space-y-1.5">
          {Object.entries(CREATOR_TYPES).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCreatorTypeChange(value)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-all',
                filter.creatorType === value
                  ? 'bg-primary/10 ring-1 ring-primary'
                  : 'hover:bg-accent'
              )}
            >
              <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-xs">
                {value === 'all' && ''}
                {value === 'nexus' && 'N'}
                {value === 'community' && 'C'}
                {value === 'partner' && 'P'}
              </span>
              <span>
                {key === 'ALL' ? 'All Creators' : key.charAt(0) + key.slice(1).toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Clear All Button (at bottom) */}
      {isFiltered && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClearAll}
        >
          <svg
            className="w-4 h-4 mr-2"
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
          Clear All Filters
        </Button>
      )}
    </div>
  )
}

export default FilterPanel

/**
 * Filter Service
 *
 * Advanced filtering system for marketplace templates.
 * Handles URL serialization, filter validation, and query building.
 */

import type {
  FilterState,
  FilterValidationResult,
  CategoryId,
  SortOption,
  PriceTier,
  CreatorType,
} from './types'
import {
  DEFAULT_FILTER_STATE,
  CATEGORY_IDS,
  SORT_OPTIONS,
  PRICE_TIERS,
  CREATOR_TYPES,
} from './types'

// =============================================================================
// URL PARAMETER KEYS
// =============================================================================

const URL_PARAMS = {
  QUERY: 'q',
  CATEGORIES: 'cat',
  TAGS: 'tags',
  INTEGRATIONS: 'int',
  PRICE_MIN: 'pmin',
  PRICE_MAX: 'pmax',
  RATING: 'rating',
  PRICE_TIER: 'tier',
  CREATOR: 'creator',
  SORT: 'sort',
  PREMIUM: 'premium',
  FEATURED: 'featured',
  NEW: 'new',
} as const

// =============================================================================
// FILTER BUILDING
// =============================================================================

/**
 * Build a filter query object from partial filter state
 */
export function buildFilterQuery(
  partialFilter: Partial<FilterState>
): FilterState {
  return {
    ...DEFAULT_FILTER_STATE,
    ...partialFilter,
    priceRange: {
      ...DEFAULT_FILTER_STATE.priceRange,
      ...partialFilter.priceRange,
    },
    features: {
      ...DEFAULT_FILTER_STATE.features,
      ...partialFilter.features,
    },
  }
}

/**
 * Merge multiple filters into one
 */
export function combineFilters(
  ...filters: Partial<FilterState>[]
): FilterState {
  let result = { ...DEFAULT_FILTER_STATE }

  for (const filter of filters) {
    // Merge arrays (unique values only)
    if (filter.categories) {
      result.categories = [
        ...new Set([...result.categories, ...filter.categories]),
      ]
    }
    if (filter.tags) {
      result.tags = [...new Set([...result.tags, ...filter.tags])]
    }
    if (filter.integrations) {
      result.integrations = [
        ...new Set([...result.integrations, ...filter.integrations]),
      ]
    }

    // Override scalar values
    if (filter.searchQuery !== undefined) {
      result.searchQuery = filter.searchQuery
    }
    if (filter.rating !== undefined) {
      result.rating = filter.rating
    }
    if (filter.priceTier !== undefined) {
      result.priceTier = filter.priceTier
    }
    if (filter.creatorType !== undefined) {
      result.creatorType = filter.creatorType
    }
    if (filter.sortBy !== undefined) {
      result.sortBy = filter.sortBy
    }

    // Merge price range (take most restrictive)
    if (filter.priceRange) {
      result.priceRange = {
        min: Math.max(result.priceRange.min, filter.priceRange.min ?? 0),
        max: Math.min(result.priceRange.max, filter.priceRange.max ?? 100),
      }
    }

    // Merge features
    if (filter.features) {
      result.features = {
        isPremium: filter.features.isPremium ?? result.features.isPremium,
        isFeatured: filter.features.isFeatured ?? result.features.isFeatured,
        isNew: filter.features.isNew ?? result.features.isNew,
      }
    }
  }

  return result
}

// =============================================================================
// URL SERIALIZATION
// =============================================================================

/**
 * Serialize filter state to URL search params
 */
export function serializeFilterToUrl(filter: FilterState): string {
  const params = new URLSearchParams()

  // Search query
  if (filter.searchQuery) {
    params.set(URL_PARAMS.QUERY, filter.searchQuery)
  }

  // Categories (comma-separated)
  if (filter.categories.length > 0) {
    params.set(URL_PARAMS.CATEGORIES, filter.categories.join(','))
  }

  // Tags (comma-separated)
  if (filter.tags.length > 0) {
    params.set(URL_PARAMS.TAGS, filter.tags.join(','))
  }

  // Integrations (comma-separated)
  if (filter.integrations.length > 0) {
    params.set(URL_PARAMS.INTEGRATIONS, filter.integrations.join(','))
  }

  // Price range
  if (filter.priceRange.min !== DEFAULT_FILTER_STATE.priceRange.min) {
    params.set(URL_PARAMS.PRICE_MIN, filter.priceRange.min.toString())
  }
  if (filter.priceRange.max !== DEFAULT_FILTER_STATE.priceRange.max) {
    params.set(URL_PARAMS.PRICE_MAX, filter.priceRange.max.toString())
  }

  // Rating
  if (filter.rating !== null) {
    params.set(URL_PARAMS.RATING, filter.rating.toString())
  }

  // Price tier
  if (filter.priceTier !== PRICE_TIERS.ALL) {
    params.set(URL_PARAMS.PRICE_TIER, filter.priceTier)
  }

  // Creator type
  if (filter.creatorType !== CREATOR_TYPES.ALL) {
    params.set(URL_PARAMS.CREATOR, filter.creatorType)
  }

  // Sort
  if (filter.sortBy !== SORT_OPTIONS.POPULARITY) {
    params.set(URL_PARAMS.SORT, filter.sortBy)
  }

  // Features
  if (filter.features.isPremium !== null) {
    params.set(URL_PARAMS.PREMIUM, filter.features.isPremium.toString())
  }
  if (filter.features.isFeatured !== null) {
    params.set(URL_PARAMS.FEATURED, filter.features.isFeatured.toString())
  }
  if (filter.features.isNew !== null) {
    params.set(URL_PARAMS.NEW, filter.features.isNew.toString())
  }

  return params.toString()
}

/**
 * Parse filter state from URL search params
 */
export function parseFilterFromUrl(
  searchParams: URLSearchParams | string
): FilterState {
  const params =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams)
      : searchParams

  const filter: FilterState = { ...DEFAULT_FILTER_STATE }

  // Search query
  const query = params.get(URL_PARAMS.QUERY)
  if (query) {
    filter.searchQuery = query
  }

  // Categories
  const categories = params.get(URL_PARAMS.CATEGORIES)
  if (categories) {
    filter.categories = categories.split(',').filter(Boolean) as CategoryId[]
  }

  // Tags
  const tags = params.get(URL_PARAMS.TAGS)
  if (tags) {
    filter.tags = tags.split(',').filter(Boolean)
  }

  // Integrations
  const integrations = params.get(URL_PARAMS.INTEGRATIONS)
  if (integrations) {
    filter.integrations = integrations.split(',').filter(Boolean)
  }

  // Price range
  const priceMin = params.get(URL_PARAMS.PRICE_MIN)
  const priceMax = params.get(URL_PARAMS.PRICE_MAX)
  if (priceMin) {
    filter.priceRange.min = parseInt(priceMin, 10)
  }
  if (priceMax) {
    filter.priceRange.max = parseInt(priceMax, 10)
  }

  // Rating
  const rating = params.get(URL_PARAMS.RATING)
  if (rating) {
    filter.rating = parseFloat(rating)
  }

  // Price tier
  const priceTier = params.get(URL_PARAMS.PRICE_TIER)
  if (priceTier && isValidPriceTier(priceTier)) {
    filter.priceTier = priceTier
  }

  // Creator type
  const creator = params.get(URL_PARAMS.CREATOR)
  if (creator && isValidCreatorType(creator)) {
    filter.creatorType = creator
  }

  // Sort
  const sort = params.get(URL_PARAMS.SORT)
  if (sort && isValidSortOption(sort)) {
    filter.sortBy = sort
  }

  // Features
  const premium = params.get(URL_PARAMS.PREMIUM)
  if (premium !== null) {
    filter.features.isPremium = premium === 'true'
  }

  const featured = params.get(URL_PARAMS.FEATURED)
  if (featured !== null) {
    filter.features.isFeatured = featured === 'true'
  }

  const isNew = params.get(URL_PARAMS.NEW)
  if (isNew !== null) {
    filter.features.isNew = isNew === 'true'
  }

  return filter
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Type guard for valid sort options
 */
function isValidSortOption(value: string): value is SortOption {
  return Object.values(SORT_OPTIONS).includes(value as SortOption)
}

/**
 * Type guard for valid price tiers
 */
function isValidPriceTier(value: string): value is PriceTier {
  return Object.values(PRICE_TIERS).includes(value as PriceTier)
}

/**
 * Type guard for valid creator types
 */
function isValidCreatorType(value: string): value is CreatorType {
  return Object.values(CREATOR_TYPES).includes(value as CreatorType)
}

/**
 * Type guard for valid category IDs
 */
function isValidCategoryId(value: string): value is CategoryId {
  return Object.values(CATEGORY_IDS).includes(value as CategoryId)
}

/**
 * Validate filter state and return sanitized version
 */
export function validateFilter(filter: FilterState): FilterValidationResult {
  const errors: string[] = []
  const sanitizedFilter: FilterState = { ...DEFAULT_FILTER_STATE }

  // Validate search query (max 200 chars, no XSS)
  if (filter.searchQuery) {
    const sanitizedQuery = filter.searchQuery
      .slice(0, 200)
      .replace(/<[^>]*>/g, '')
      .trim()
    sanitizedFilter.searchQuery = sanitizedQuery

    if (sanitizedQuery !== filter.searchQuery) {
      errors.push('Search query was sanitized')
    }
  }

  // Validate categories
  const validCategories = filter.categories.filter(isValidCategoryId)
  sanitizedFilter.categories = validCategories
  if (validCategories.length !== filter.categories.length) {
    errors.push('Some invalid categories were removed')
  }

  // Validate tags (alphanumeric + hyphens, max 50 chars each)
  const validTags = filter.tags
    .map((tag) => tag.slice(0, 50).replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())
    .filter(Boolean)
  sanitizedFilter.tags = validTags

  // Validate integrations (alphanumeric + spaces, max 50 chars each)
  const validIntegrations = filter.integrations
    .map((int) => int.slice(0, 50).trim())
    .filter(Boolean)
  sanitizedFilter.integrations = validIntegrations

  // Validate price range
  const minPrice = Math.max(0, Math.min(100, filter.priceRange.min))
  const maxPrice = Math.max(0, Math.min(100, filter.priceRange.max))
  sanitizedFilter.priceRange = {
    min: Math.min(minPrice, maxPrice),
    max: Math.max(minPrice, maxPrice),
  }

  // Validate rating (0-5 range)
  if (filter.rating !== null) {
    const validRating = Math.max(0, Math.min(5, filter.rating))
    sanitizedFilter.rating = validRating
    if (validRating !== filter.rating) {
      errors.push('Rating was adjusted to valid range (0-5)')
    }
  }

  // Validate price tier
  sanitizedFilter.priceTier = isValidPriceTier(filter.priceTier)
    ? filter.priceTier
    : PRICE_TIERS.ALL

  // Validate creator type
  sanitizedFilter.creatorType = isValidCreatorType(filter.creatorType)
    ? filter.creatorType
    : CREATOR_TYPES.ALL

  // Validate sort option
  sanitizedFilter.sortBy = isValidSortOption(filter.sortBy)
    ? filter.sortBy
    : SORT_OPTIONS.POPULARITY

  // Validate features
  sanitizedFilter.features = {
    isPremium:
      typeof filter.features.isPremium === 'boolean'
        ? filter.features.isPremium
        : null,
    isFeatured:
      typeof filter.features.isFeatured === 'boolean'
        ? filter.features.isFeatured
        : null,
    isNew:
      typeof filter.features.isNew === 'boolean' ? filter.features.isNew : null,
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFilter,
  }
}

// =============================================================================
// FILTER UTILITIES
// =============================================================================

/**
 * Check if filter has any active filters
 */
export function hasActiveFilters(filter: FilterState): boolean {
  return (
    filter.searchQuery !== '' ||
    filter.categories.length > 0 ||
    filter.tags.length > 0 ||
    filter.integrations.length > 0 ||
    filter.priceRange.min !== DEFAULT_FILTER_STATE.priceRange.min ||
    filter.priceRange.max !== DEFAULT_FILTER_STATE.priceRange.max ||
    filter.rating !== null ||
    filter.priceTier !== PRICE_TIERS.ALL ||
    filter.creatorType !== CREATOR_TYPES.ALL ||
    filter.features.isPremium !== null ||
    filter.features.isFeatured !== null ||
    filter.features.isNew !== null
  )
}

/**
 * Count number of active filters
 */
export function countActiveFilters(filter: FilterState): number {
  let count = 0

  if (filter.searchQuery) count++
  count += filter.categories.length
  count += filter.tags.length
  count += filter.integrations.length
  if (filter.priceRange.min !== DEFAULT_FILTER_STATE.priceRange.min) count++
  if (filter.priceRange.max !== DEFAULT_FILTER_STATE.priceRange.max) count++
  if (filter.rating !== null) count++
  if (filter.priceTier !== PRICE_TIERS.ALL) count++
  if (filter.creatorType !== CREATOR_TYPES.ALL) count++
  if (filter.features.isPremium !== null) count++
  if (filter.features.isFeatured !== null) count++
  if (filter.features.isNew !== null) count++

  return count
}

/**
 * Get human-readable filter summary
 */
export function getFilterSummary(filter: FilterState): string[] {
  const summary: string[] = []

  if (filter.searchQuery) {
    summary.push(`Search: "${filter.searchQuery}"`)
  }

  if (filter.categories.length > 0) {
    summary.push(`Categories: ${filter.categories.join(', ')}`)
  }

  if (filter.tags.length > 0) {
    summary.push(`Tags: ${filter.tags.join(', ')}`)
  }

  if (filter.integrations.length > 0) {
    summary.push(`Integrations: ${filter.integrations.join(', ')}`)
  }

  if (filter.rating !== null) {
    summary.push(`Rating: ${filter.rating}+ stars`)
  }

  if (filter.priceTier !== PRICE_TIERS.ALL) {
    summary.push(`Price: ${filter.priceTier}`)
  }

  if (filter.creatorType !== CREATOR_TYPES.ALL) {
    summary.push(`Creator: ${filter.creatorType}`)
  }

  if (filter.features.isPremium === true) {
    summary.push('Premium only')
  } else if (filter.features.isPremium === false) {
    summary.push('Free only')
  }

  if (filter.features.isFeatured === true) {
    summary.push('Featured only')
  }

  if (filter.features.isNew === true) {
    summary.push('New only')
  }

  return summary
}

/**
 * Remove a specific filter value
 */
export function removeFilterValue(
  filter: FilterState,
  type: keyof FilterState | 'feature',
  value?: string
): FilterState {
  const newFilter = { ...filter }

  switch (type) {
    case 'searchQuery':
      newFilter.searchQuery = ''
      break
    case 'categories':
      if (value) {
        newFilter.categories = filter.categories.filter((c) => c !== value)
      } else {
        newFilter.categories = []
      }
      break
    case 'tags':
      if (value) {
        newFilter.tags = filter.tags.filter((t) => t !== value)
      } else {
        newFilter.tags = []
      }
      break
    case 'integrations':
      if (value) {
        newFilter.integrations = filter.integrations.filter((i) => i !== value)
      } else {
        newFilter.integrations = []
      }
      break
    case 'rating':
      newFilter.rating = null
      break
    case 'priceTier':
      newFilter.priceTier = PRICE_TIERS.ALL
      break
    case 'creatorType':
      newFilter.creatorType = CREATOR_TYPES.ALL
      break
    case 'feature':
      if (value === 'premium') {
        newFilter.features = { ...filter.features, isPremium: null }
      } else if (value === 'featured') {
        newFilter.features = { ...filter.features, isFeatured: null }
      } else if (value === 'new') {
        newFilter.features = { ...filter.features, isNew: null }
      }
      break
    default:
      break
  }

  return newFilter
}

/**
 * Reset filter to default state
 */
export function resetFilter(): FilterState {
  return { ...DEFAULT_FILTER_STATE }
}

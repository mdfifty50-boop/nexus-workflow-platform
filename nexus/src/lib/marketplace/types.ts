/**
 * Marketplace Types
 *
 * Core type definitions for the template marketplace system.
 * Uses const objects with type aliases instead of enums per project guidelines.
 */

// =============================================================================
// CATEGORY TYPES
// =============================================================================

export const CATEGORY_IDS = {
  ALL: 'all',
  FAVORITES: 'favorites',
  MARKETING: 'marketing',
  SALES: 'sales',
  OPERATIONS: 'operations',
  HR: 'hr',
  DEVELOPMENT: 'development',
  FINANCE: 'finance',
  CUSTOMER: 'customer',
  MEETINGS: 'meetings',
  HEALTHCARE: 'healthcare',
  LEGAL: 'legal',
  EDUCATION: 'education',
  CUSTOM: 'custom',
} as const

export type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS]

export interface Category {
  id: CategoryId
  label: string
  icon: string
  color: string
  description?: string
  parentId?: CategoryId
  subcategories?: Category[]
}

export interface CategoryStats {
  categoryId: CategoryId
  count: number
  popularTemplates: string[]
  averageRating: number
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export const SORT_OPTIONS = {
  POPULARITY: 'popularity',
  RATING: 'rating',
  NEWEST: 'newest',
  MOST_USED: 'most_used',
  TIME_SAVED: 'time_saved',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
} as const

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS]

export const PRICE_TIERS = {
  ALL: 'all',
  FREE: 'free',
  PREMIUM: 'premium',
} as const

export type PriceTier = typeof PRICE_TIERS[keyof typeof PRICE_TIERS]

export const CREATOR_TYPES = {
  ALL: 'all',
  NEXUS: 'nexus',
  COMMUNITY: 'community',
  PARTNER: 'partner',
} as const

export type CreatorType = typeof CREATOR_TYPES[keyof typeof CREATOR_TYPES]

export interface FilterState {
  searchQuery: string
  categories: CategoryId[]
  tags: string[]
  integrations: string[]
  priceRange: {
    min: number
    max: number
  }
  rating: number | null
  priceTier: PriceTier
  creatorType: CreatorType
  sortBy: SortOption
  features: {
    isPremium: boolean | null
    isFeatured: boolean | null
    isNew: boolean | null
  }
}

export interface FilterValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedFilter: FilterState
}

// =============================================================================
// TAG TYPES
// =============================================================================

export interface Tag {
  id: string
  name: string
  slug: string
  usageCount: number
  category?: CategoryId
}

export interface TagSuggestion {
  tag: Tag
  relevanceScore: number
  reason: string
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface SearchSuggestion {
  type: 'template' | 'tag' | 'category' | 'integration' | 'recent'
  id: string
  label: string
  description?: string
  icon?: string
  metadata?: Record<string, unknown>
}

export interface SearchHistory {
  query: string
  timestamp: number
  resultCount: number
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_FILTER_STATE: FilterState = {
  searchQuery: '',
  categories: [],
  tags: [],
  integrations: [],
  priceRange: {
    min: 0,
    max: 100,
  },
  rating: null,
  priceTier: PRICE_TIERS.ALL,
  creatorType: CREATOR_TYPES.ALL,
  sortBy: SORT_OPTIONS.POPULARITY,
  features: {
    isPremium: null,
    isFeatured: null,
    isNew: null,
  },
}

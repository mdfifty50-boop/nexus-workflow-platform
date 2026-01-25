/**
 * Marketplace Types
 *
 * Core type definitions for the template marketplace browsing system.
 * Follows project conventions: const objects with type aliases (no enums).
 */

// =============================================================================
// MARKETPLACE CATEGORIES
// =============================================================================

/**
 * Available marketplace template categories
 */
export const MarketplaceCategory = {
  AUTOMATION: 'automation',
  BUSINESS: 'business',
  ECOMMERCE: 'e-commerce',
  MARKETING: 'marketing',
  SALES: 'sales',
  HR: 'hr',
  FINANCE: 'finance',
  IT: 'it',
  GCC: 'gcc',
  HEALTHCARE: 'healthcare',
  LEGAL: 'legal',
  EDUCATION: 'education',
  OPERATIONS: 'operations',
  CUSTOMER_SUCCESS: 'customer-success',
} as const

export type MarketplaceCategoryType = typeof MarketplaceCategory[keyof typeof MarketplaceCategory]

// =============================================================================
// TEMPLATE SORT OPTIONS
// =============================================================================

/**
 * Available sorting options for marketplace templates
 */
export const TemplateSort = {
  POPULAR: 'popular',
  RECENT: 'recent',
  RATING: 'rating',
  DOWNLOADS: 'downloads',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high',
  ALPHABETICAL: 'alphabetical',
} as const

export type TemplateSortType = typeof TemplateSort[keyof typeof TemplateSort]

// =============================================================================
// PRICE TIERS
// =============================================================================

/**
 * Price tier classifications
 */
export const PriceTier = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const

export type PriceTierType = typeof PriceTier[keyof typeof PriceTier]

// =============================================================================
// MARKETPLACE TEMPLATE
// =============================================================================

/**
 * Author information for a marketplace template
 */
export interface TemplateAuthor {
  id: string
  name: string
  type: 'nexus' | 'community' | 'partner' | 'verified'
  avatarUrl?: string
  verified?: boolean
}

/**
 * Template pricing information
 */
export interface TemplatePricing {
  tier: PriceTierType
  price: number // 0 for free
  currency: string
  originalPrice?: number // For discounts
}

/**
 * Template statistics
 */
export interface TemplateStats {
  downloads: number
  rating: number
  reviewCount: number
  activeUsers: number
  lastUpdated: string
}

/**
 * Core marketplace template interface
 */
export interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  shortDescription?: string
  author: TemplateAuthor
  category: MarketplaceCategoryType
  tags: string[]
  pricing: TemplatePricing
  stats: TemplateStats

  // Visual
  icon: string
  previewImageUrl?: string
  thumbnailUrl?: string

  // Content
  integrations: string[]
  steps: number
  agents: string[]
  estimatedTimeSaved: string
  successRate: number

  // Metadata
  featured?: boolean
  isNew?: boolean
  isPremium: boolean
  createdAt: string
  updatedAt: string
  version: string
}

// =============================================================================
// TEMPLATE FILTER
// =============================================================================

/**
 * Price range for filtering
 */
export interface PriceRange {
  min: number
  max: number | null // null for unlimited
}

/**
 * Filter options for template search
 */
export interface TemplateFilter {
  categories?: MarketplaceCategoryType[]
  priceRange?: PriceRange
  priceTiers?: PriceTierType[]
  minRating?: number
  tags?: string[]
  integrations?: string[]
  authorTypes?: TemplateAuthor['type'][]
  featured?: boolean
  isNew?: boolean
  isPremium?: boolean
  searchQuery?: string
}

// =============================================================================
// SEARCH RESULTS
// =============================================================================

/**
 * Pagination information for search results
 */
export interface PaginationInfo {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Search result with pagination
 */
export interface SearchResult {
  templates: MarketplaceTemplate[]
  pagination: PaginationInfo
  filters: TemplateFilter
  sortBy: TemplateSortType
  searchTime: number // milliseconds
}

/**
 * Search parameters for API calls
 */
export interface SearchParams {
  query?: string
  filters?: TemplateFilter
  sortBy?: TemplateSortType
  page?: number
  pageSize?: number
}

// =============================================================================
// TEMPLATE COLLECTION
// =============================================================================

/**
 * A curated collection of templates
 */
export interface TemplateCollection {
  id: string
  name: string
  description: string
  icon: string
  templates: MarketplaceTemplate[]
  featured?: boolean
}

// =============================================================================
// HELPER TYPE GUARDS
// =============================================================================

/**
 * Check if a value is a valid marketplace category
 */
export function isMarketplaceCategory(value: string): value is MarketplaceCategoryType {
  return Object.values(MarketplaceCategory).includes(value as MarketplaceCategoryType)
}

/**
 * Check if a value is a valid template sort option
 */
export function isTemplateSort(value: string): value is TemplateSortType {
  return Object.values(TemplateSort).includes(value as TemplateSortType)
}

/**
 * Check if a value is a valid price tier
 */
export function isPriceTier(value: string): value is PriceTierType {
  return Object.values(PriceTier).includes(value as PriceTierType)
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Category display information
 */
export const CategoryDisplay: Record<MarketplaceCategoryType, { label: string; icon: string; color: string }> = {
  [MarketplaceCategory.AUTOMATION]: { label: 'Automation', icon: '⚡', color: 'cyan' },
  [MarketplaceCategory.BUSINESS]: { label: 'Business', icon: '💼', color: 'blue' },
  [MarketplaceCategory.ECOMMERCE]: { label: 'E-commerce', icon: '🛒', color: 'emerald' },
  [MarketplaceCategory.MARKETING]: { label: 'Marketing', icon: '📢', color: 'pink' },
  [MarketplaceCategory.SALES]: { label: 'Sales', icon: '💰', color: 'amber' },
  [MarketplaceCategory.HR]: { label: 'HR', icon: '👥', color: 'violet' },
  [MarketplaceCategory.FINANCE]: { label: 'Finance', icon: '📊', color: 'green' },
  [MarketplaceCategory.IT]: { label: 'IT', icon: '💻', color: 'slate' },
  [MarketplaceCategory.GCC]: { label: 'GCC', icon: '🌍', color: 'orange' },
  [MarketplaceCategory.HEALTHCARE]: { label: 'Healthcare', icon: '🏥', color: 'red' },
  [MarketplaceCategory.LEGAL]: { label: 'Legal', icon: '⚖️', color: 'indigo' },
  [MarketplaceCategory.EDUCATION]: { label: 'Education', icon: '📚', color: 'purple' },
  [MarketplaceCategory.OPERATIONS]: { label: 'Operations', icon: '⚙️', color: 'gray' },
  [MarketplaceCategory.CUSTOMER_SUCCESS]: { label: 'Customer Success', icon: '🎯', color: 'teal' },
}

/**
 * Sort option display information
 */
export const SortDisplay: Record<TemplateSortType, { label: string; icon: string }> = {
  [TemplateSort.POPULAR]: { label: 'Most Popular', icon: '🔥' },
  [TemplateSort.RECENT]: { label: 'Recently Added', icon: '🆕' },
  [TemplateSort.RATING]: { label: 'Highest Rated', icon: '⭐' },
  [TemplateSort.DOWNLOADS]: { label: 'Most Downloads', icon: '📥' },
  [TemplateSort.PRICE_LOW]: { label: 'Price: Low to High', icon: '💵' },
  [TemplateSort.PRICE_HIGH]: { label: 'Price: High to Low', icon: '💰' },
  [TemplateSort.ALPHABETICAL]: { label: 'Alphabetical', icon: '🔤' },
}

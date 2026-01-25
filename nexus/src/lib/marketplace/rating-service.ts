// Rating Service for Template Marketplace

import type {
  ReviewStats,
  RatingDistribution,
  TemplateReview,
} from './review-types'
import { ReviewStatus } from './review-types'

// Storage keys
const REVIEWS_STORAGE_KEY = 'nexus_template_reviews'
const RATING_CACHE_KEY = 'nexus_template_ratings'

/**
 * Cache entry for template ratings
 */
interface RatingCacheEntry {
  templateId: string
  stats: ReviewStats
  updatedAt: string
}

/**
 * Get all reviews from storage
 */
function getAllReviews(): TemplateReview[] {
  try {
    const stored = localStorage.getItem(REVIEWS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Get rating cache from storage
 */
function getRatingCache(): Record<string, RatingCacheEntry> {
  try {
    const stored = localStorage.getItem(RATING_CACHE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Save rating cache to storage
 */
function saveRatingCache(cache: Record<string, RatingCacheEntry>): void {
  localStorage.setItem(RATING_CACHE_KEY, JSON.stringify(cache))
}

/**
 * Calculate weighted average rating
 * Uses Wilson score interval for more accurate ranking
 */
export function calculateAverageRating(reviews: TemplateReview[]): number {
  if (reviews.length === 0) return 0

  // Filter only published reviews
  const publishedReviews = reviews.filter(r => r.status === ReviewStatus.Published)
  if (publishedReviews.length === 0) return 0

  // Weight verified reviews more heavily
  let totalWeight = 0
  let weightedSum = 0

  publishedReviews.forEach(review => {
    const weight = review.verified ? 1.2 : 1.0
    weightedSum += review.rating * weight
    totalWeight += weight
  })

  const rawAverage = weightedSum / totalWeight

  // Apply Wilson score interval for small sample sizes
  // This prevents templates with 1 five-star review from ranking above
  // templates with many four-star reviews
  const n = publishedReviews.length
  if (n < 10) {
    // Bayesian average with prior of 3.5 stars
    const prior = 3.5
    const priorWeight = 5 // Equivalent to 5 reviews at prior rating
    return (rawAverage * n + prior * priorWeight) / (n + priorWeight)
  }

  return Math.round(rawAverage * 10) / 10 // Round to 1 decimal
}

/**
 * Get rating distribution by star count
 */
export function getRatingDistribution(reviews: TemplateReview[]): RatingDistribution {
  const distribution: RatingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  const publishedReviews = reviews.filter(r => r.status === ReviewStatus.Published)

  publishedReviews.forEach(review => {
    const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++
    }
  })

  return distribution
}

/**
 * Calculate review statistics for a template
 */
export function calculateReviewStats(templateId: string): ReviewStats {
  const allReviews = getAllReviews()
  const templateReviews = allReviews.filter(
    r => r.templateId === templateId && r.status === ReviewStatus.Published
  )

  if (templateReviews.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedCount: 0,
      recommendPercent: 0,
    }
  }

  const average = calculateAverageRating(templateReviews)
  const distribution = getRatingDistribution(templateReviews)
  const verifiedCount = templateReviews.filter(r => r.verified).length
  const recommendCount = templateReviews.filter(r => r.rating >= 4).length
  const recommendPercent = Math.round((recommendCount / templateReviews.length) * 100)

  return {
    average,
    count: templateReviews.length,
    distribution,
    verifiedCount,
    recommendPercent,
  }
}

/**
 * Get review stats for a template (with caching)
 */
export function getTemplateRatingStats(templateId: string): ReviewStats {
  const cache = getRatingCache()
  const cacheEntry = cache[templateId]

  // Check if cache is still valid (5 minutes)
  if (cacheEntry) {
    const cacheAge = Date.now() - new Date(cacheEntry.updatedAt).getTime()
    if (cacheAge < 5 * 60 * 1000) {
      return cacheEntry.stats
    }
  }

  // Calculate fresh stats
  const stats = calculateReviewStats(templateId)

  // Update cache
  cache[templateId] = {
    templateId,
    stats,
    updatedAt: new Date().toISOString(),
  }
  saveRatingCache(cache)

  return stats
}

/**
 * Update template rating cache (call after new review)
 */
export function updateTemplateRating(templateId: string): ReviewStats {
  const stats = calculateReviewStats(templateId)

  // Update cache
  const cache = getRatingCache()
  cache[templateId] = {
    templateId,
    stats,
    updatedAt: new Date().toISOString(),
  }
  saveRatingCache(cache)

  return stats
}

/**
 * Get top rated templates
 */
export function getTopRatedTemplates(
  templateIds: string[],
  limit: number = 10
): Array<{ templateId: string; stats: ReviewStats }> {
  const templatesWithRatings = templateIds.map(templateId => ({
    templateId,
    stats: getTemplateRatingStats(templateId),
  }))

  // Sort by average rating (descending), then by review count (descending)
  return templatesWithRatings
    .filter(t => t.stats.count > 0) // Only templates with reviews
    .sort((a, b) => {
      if (b.stats.average !== a.stats.average) {
        return b.stats.average - a.stats.average
      }
      return b.stats.count - a.stats.count
    })
    .slice(0, limit)
}

/**
 * Get templates sorted by rating
 */
export function sortTemplatesByRating(
  templateIds: string[],
  ascending: boolean = false
): string[] {
  const templatesWithRatings = templateIds.map(templateId => ({
    templateId,
    stats: getTemplateRatingStats(templateId),
  }))

  templatesWithRatings.sort((a, b) => {
    const comparison = a.stats.average - b.stats.average
    return ascending ? comparison : -comparison
  })

  return templatesWithRatings.map(t => t.templateId)
}

/**
 * Get percentage of each star rating
 */
export function getRatingPercentages(distribution: RatingDistribution): RatingDistribution {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  }

  return {
    1: Math.round((distribution[1] / total) * 100),
    2: Math.round((distribution[2] / total) * 100),
    3: Math.round((distribution[3] / total) * 100),
    4: Math.round((distribution[4] / total) * 100),
    5: Math.round((distribution[5] / total) * 100),
  }
}

/**
 * Check if a template is highly rated (4+ stars with minimum reviews)
 */
export function isHighlyRated(templateId: string, minReviews: number = 5): boolean {
  const stats = getTemplateRatingStats(templateId)
  return stats.average >= 4.0 && stats.count >= minReviews
}

/**
 * Get rating tier for display
 */
export function getRatingTier(average: number): {
  tier: 'excellent' | 'good' | 'average' | 'poor' | 'none'
  color: string
  label: string
} {
  if (average === 0) {
    return { tier: 'none', color: 'text-slate-400', label: 'No ratings' }
  }
  if (average >= 4.5) {
    return { tier: 'excellent', color: 'text-emerald-400', label: 'Excellent' }
  }
  if (average >= 4.0) {
    return { tier: 'good', color: 'text-cyan-400', label: 'Very Good' }
  }
  if (average >= 3.0) {
    return { tier: 'average', color: 'text-amber-400', label: 'Good' }
  }
  return { tier: 'poor', color: 'text-red-400', label: 'Below Average' }
}

/**
 * Clear rating cache (useful for testing)
 */
export function clearRatingCache(): void {
  localStorage.removeItem(RATING_CACHE_KEY)
}

/**
 * Invalidate cache for a specific template
 */
export function invalidateTemplateRatingCache(templateId: string): void {
  const cache = getRatingCache()
  delete cache[templateId]
  saveRatingCache(cache)
}

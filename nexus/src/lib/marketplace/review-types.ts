// Review Types for Template Marketplace

/**
 * Sort options for reviews
 */
export const ReviewSortType = {
  Recent: 'recent',
  Helpful: 'helpful',
  HighRating: 'high_rating',
  LowRating: 'low_rating',
} as const

export type ReviewSortTypeValue = typeof ReviewSortType[keyof typeof ReviewSortType]

/**
 * Review status types
 */
export const ReviewStatus = {
  Published: 'published',
  Pending: 'pending',
  Flagged: 'flagged',
  Removed: 'removed',
} as const

export type ReviewStatusValue = typeof ReviewStatus[keyof typeof ReviewStatus]

/**
 * Review author information
 */
export interface ReviewAuthor {
  id: string
  name: string
  avatarUrl?: string
  isVerifiedBuyer: boolean
  reviewCount?: number
  joinedAt?: string
}

/**
 * Response from template author to a review
 */
export interface ReviewResponse {
  id: string
  reviewId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  updatedAt?: string
}

/**
 * Main review interface
 */
export interface TemplateReview {
  id: string
  templateId: string
  userId: string
  rating: number // 1-5 stars
  title: string
  content: string
  helpfulCount: number
  verified: boolean // Did user actually use the template?
  createdAt: string
  updatedAt?: string
  status: ReviewStatusValue
  author?: ReviewAuthor
  response?: ReviewResponse
  // User interaction tracking
  userMarkedHelpful?: boolean
  userReported?: boolean
}

/**
 * Rating distribution by star count
 */
export interface RatingDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

/**
 * Aggregate review statistics for a template
 */
export interface ReviewStats {
  average: number
  count: number
  distribution: RatingDistribution
  verifiedCount: number
  recommendPercent: number // Percentage who rated 4+ stars
}

/**
 * Input for creating a new review
 */
export interface CreateReviewInput {
  templateId: string
  rating: number
  title: string
  content: string
}

/**
 * Input for updating an existing review
 */
export interface UpdateReviewInput {
  id: string
  rating?: number
  title?: string
  content?: string
}

/**
 * Paginated reviews response
 */
export interface PaginatedReviews {
  reviews: TemplateReview[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Review filters for fetching
 */
export interface ReviewFilters {
  templateId?: string
  userId?: string
  minRating?: number
  maxRating?: number
  verified?: boolean
  sortBy?: ReviewSortTypeValue
  page?: number
  pageSize?: number
}

/**
 * Review action result
 */
export interface ReviewActionResult {
  success: boolean
  message: string
  review?: TemplateReview
}

/**
 * Default review page size
 */
export const DEFAULT_REVIEW_PAGE_SIZE = 10

/**
 * Maximum review content length
 */
export const MAX_REVIEW_CONTENT_LENGTH = 2000

/**
 * Maximum review title length
 */
export const MAX_REVIEW_TITLE_LENGTH = 100

/**
 * Minimum review content length
 */
export const MIN_REVIEW_CONTENT_LENGTH = 20

/**
 * Rating labels for display
 */
export const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

/**
 * Get label for a rating value
 */
export function getRatingLabel(rating: number): string {
  return RATING_LABELS[Math.round(rating)] || 'Unknown'
}

/**
 * Validate rating is within bounds
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
}

/**
 * Format relative time for reviews
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffDays < 1) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
}

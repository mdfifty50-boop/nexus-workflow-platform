// Review Service for Template Marketplace

import type {
  TemplateReview,
  CreateReviewInput,
  UpdateReviewInput,
  PaginatedReviews,
  ReviewFilters,
  ReviewActionResult,
} from './review-types'
import {
  ReviewSortType,
  ReviewStatus,
  DEFAULT_REVIEW_PAGE_SIZE,
  MAX_REVIEW_CONTENT_LENGTH,
  MAX_REVIEW_TITLE_LENGTH,
  MIN_REVIEW_CONTENT_LENGTH,
  isValidRating,
} from './review-types'

// Storage keys
const REVIEWS_STORAGE_KEY = 'nexus_template_reviews'
const HELPFUL_VOTES_KEY = 'nexus_review_helpful_votes'

/**
 * Generate a unique ID for reviews
 */
function generateReviewId(): string {
  return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
 * Save all reviews to storage
 */
function saveAllReviews(reviews: TemplateReview[]): void {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
}

/**
 * Get helpful votes by user
 */
function getHelpfulVotes(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(HELPFUL_VOTES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Save helpful votes
 */
function saveHelpfulVotes(votes: Record<string, string[]>): void {
  localStorage.setItem(HELPFUL_VOTES_KEY, JSON.stringify(votes))
}

/**
 * Check if user has voted a review as helpful
 */
export function hasUserVotedHelpful(userId: string, reviewId: string): boolean {
  const votes = getHelpfulVotes()
  return votes[userId]?.includes(reviewId) || false
}

/**
 * Validate review input
 */
function validateReviewInput(input: CreateReviewInput): { valid: boolean; error?: string } {
  if (!input.templateId) {
    return { valid: false, error: 'Template ID is required' }
  }

  if (!isValidRating(input.rating)) {
    return { valid: false, error: 'Rating must be between 1 and 5' }
  }

  if (!input.title || input.title.trim().length === 0) {
    return { valid: false, error: 'Review title is required' }
  }

  if (input.title.length > MAX_REVIEW_TITLE_LENGTH) {
    return { valid: false, error: `Title must be ${MAX_REVIEW_TITLE_LENGTH} characters or less` }
  }

  if (!input.content || input.content.trim().length < MIN_REVIEW_CONTENT_LENGTH) {
    return { valid: false, error: `Review content must be at least ${MIN_REVIEW_CONTENT_LENGTH} characters` }
  }

  if (input.content.length > MAX_REVIEW_CONTENT_LENGTH) {
    return { valid: false, error: `Review content must be ${MAX_REVIEW_CONTENT_LENGTH} characters or less` }
  }

  return { valid: true }
}

/**
 * Create a new review
 */
export function createReview(
  input: CreateReviewInput,
  userId: string,
  userName?: string
): ReviewActionResult {
  const validation = validateReviewInput(input)
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Invalid input' }
  }

  // Check if user already reviewed this template
  const existingReviews = getAllReviews()
  const existingReview = existingReviews.find(
    r => r.templateId === input.templateId && r.userId === userId
  )
  if (existingReview) {
    return { success: false, message: 'You have already reviewed this template' }
  }

  const review: TemplateReview = {
    id: generateReviewId(),
    templateId: input.templateId,
    userId,
    rating: input.rating,
    title: input.title.trim(),
    content: input.content.trim(),
    helpfulCount: 0,
    verified: true, // In real app, check if user actually used template
    createdAt: new Date().toISOString(),
    status: ReviewStatus.Published,
    author: {
      id: userId,
      name: userName || 'Anonymous User',
      isVerifiedBuyer: true,
    },
  }

  existingReviews.push(review)
  saveAllReviews(existingReviews)

  return { success: true, message: 'Review submitted successfully', review }
}

/**
 * Update an existing review
 */
export function updateReview(
  input: UpdateReviewInput,
  userId: string
): ReviewActionResult {
  const reviews = getAllReviews()
  const reviewIndex = reviews.findIndex(r => r.id === input.id)

  if (reviewIndex === -1) {
    return { success: false, message: 'Review not found' }
  }

  const review = reviews[reviewIndex]

  if (review.userId !== userId) {
    return { success: false, message: 'You can only edit your own reviews' }
  }

  // Validate updates
  if (input.rating !== undefined && !isValidRating(input.rating)) {
    return { success: false, message: 'Rating must be between 1 and 5' }
  }

  if (input.title !== undefined && input.title.length > MAX_REVIEW_TITLE_LENGTH) {
    return { success: false, message: `Title must be ${MAX_REVIEW_TITLE_LENGTH} characters or less` }
  }

  if (input.content !== undefined) {
    if (input.content.trim().length < MIN_REVIEW_CONTENT_LENGTH) {
      return { success: false, message: `Review content must be at least ${MIN_REVIEW_CONTENT_LENGTH} characters` }
    }
    if (input.content.length > MAX_REVIEW_CONTENT_LENGTH) {
      return { success: false, message: `Review content must be ${MAX_REVIEW_CONTENT_LENGTH} characters or less` }
    }
  }

  // Apply updates
  const updatedReview: TemplateReview = {
    ...review,
    rating: input.rating ?? review.rating,
    title: input.title?.trim() ?? review.title,
    content: input.content?.trim() ?? review.content,
    updatedAt: new Date().toISOString(),
  }

  reviews[reviewIndex] = updatedReview
  saveAllReviews(reviews)

  return { success: true, message: 'Review updated successfully', review: updatedReview }
}

/**
 * Delete a review
 */
export function deleteReview(reviewId: string, userId: string): ReviewActionResult {
  const reviews = getAllReviews()
  const reviewIndex = reviews.findIndex(r => r.id === reviewId)

  if (reviewIndex === -1) {
    return { success: false, message: 'Review not found' }
  }

  const review = reviews[reviewIndex]

  if (review.userId !== userId) {
    return { success: false, message: 'You can only delete your own reviews' }
  }

  reviews.splice(reviewIndex, 1)
  saveAllReviews(reviews)

  return { success: true, message: 'Review deleted successfully' }
}

/**
 * Get reviews for a template with pagination and sorting
 */
export function getTemplateReviews(
  templateId: string,
  filters?: Omit<ReviewFilters, 'templateId'>
): PaginatedReviews {
  const allReviews = getAllReviews()
  let filtered = allReviews.filter(r => r.templateId === templateId && r.status === ReviewStatus.Published)

  // Apply filters
  if (filters?.minRating !== undefined) {
    filtered = filtered.filter(r => r.rating >= filters.minRating!)
  }
  if (filters?.maxRating !== undefined) {
    filtered = filtered.filter(r => r.rating <= filters.maxRating!)
  }
  if (filters?.verified !== undefined) {
    filtered = filtered.filter(r => r.verified === filters.verified)
  }

  // Apply sorting
  const sortBy = filters?.sortBy || ReviewSortType.Recent
  filtered.sort((a, b) => {
    switch (sortBy) {
      case ReviewSortType.Recent:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case ReviewSortType.Helpful:
        return b.helpfulCount - a.helpfulCount
      case ReviewSortType.HighRating:
        return b.rating - a.rating
      case ReviewSortType.LowRating:
        return a.rating - b.rating
      default:
        return 0
    }
  })

  // Apply pagination
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || DEFAULT_REVIEW_PAGE_SIZE
  const startIndex = (page - 1) * pageSize
  const paginatedReviews = filtered.slice(startIndex, startIndex + pageSize)

  return {
    reviews: paginatedReviews.map(r => ({
      ...r,
      userMarkedHelpful: false, // Will be set by calling code with actual userId
    })),
    total: filtered.length,
    page,
    pageSize,
    hasMore: startIndex + pageSize < filtered.length,
  }
}

/**
 * Get reviews by a specific user
 */
export function getUserReviews(
  userId: string,
  filters?: Omit<ReviewFilters, 'userId'>
): PaginatedReviews {
  const allReviews = getAllReviews()
  let filtered = allReviews.filter(r => r.userId === userId)

  // Apply sorting
  const sortBy = filters?.sortBy || ReviewSortType.Recent
  filtered.sort((a, b) => {
    switch (sortBy) {
      case ReviewSortType.Recent:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case ReviewSortType.HighRating:
        return b.rating - a.rating
      default:
        return 0
    }
  })

  // Apply pagination
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || DEFAULT_REVIEW_PAGE_SIZE
  const startIndex = (page - 1) * pageSize
  const paginatedReviews = filtered.slice(startIndex, startIndex + pageSize)

  return {
    reviews: paginatedReviews,
    total: filtered.length,
    page,
    pageSize,
    hasMore: startIndex + pageSize < filtered.length,
  }
}

/**
 * Mark a review as helpful
 */
export function markHelpful(
  reviewId: string,
  userId: string
): ReviewActionResult {
  const reviews = getAllReviews()
  const reviewIndex = reviews.findIndex(r => r.id === reviewId)

  if (reviewIndex === -1) {
    return { success: false, message: 'Review not found' }
  }

  const review = reviews[reviewIndex]

  // Cannot vote on own review
  if (review.userId === userId) {
    return { success: false, message: 'You cannot mark your own review as helpful' }
  }

  // Check if already voted
  const votes = getHelpfulVotes()
  if (!votes[userId]) {
    votes[userId] = []
  }

  const alreadyVoted = votes[userId].includes(reviewId)

  if (alreadyVoted) {
    // Remove vote
    votes[userId] = votes[userId].filter(id => id !== reviewId)
    reviews[reviewIndex] = {
      ...review,
      helpfulCount: Math.max(0, review.helpfulCount - 1),
    }
  } else {
    // Add vote
    votes[userId].push(reviewId)
    reviews[reviewIndex] = {
      ...review,
      helpfulCount: review.helpfulCount + 1,
    }
  }

  saveHelpfulVotes(votes)
  saveAllReviews(reviews)

  return {
    success: true,
    message: alreadyVoted ? 'Helpful vote removed' : 'Marked as helpful',
    review: reviews[reviewIndex],
  }
}

/**
 * Get a single review by ID
 */
export function getReviewById(reviewId: string): TemplateReview | null {
  const reviews = getAllReviews()
  return reviews.find(r => r.id === reviewId) || null
}

/**
 * Check if user can review a template (hasn't already reviewed)
 */
export function canUserReview(templateId: string, userId: string): boolean {
  const reviews = getAllReviews()
  return !reviews.some(r => r.templateId === templateId && r.userId === userId)
}

/**
 * Get user's review for a specific template
 */
export function getUserReviewForTemplate(
  templateId: string,
  userId: string
): TemplateReview | null {
  const reviews = getAllReviews()
  return reviews.find(r => r.templateId === templateId && r.userId === userId) || null
}

/**
 * Report a review (flag for moderation)
 */
export function reportReview(
  reviewId: string,
  userId: string,
  _reason: string
): ReviewActionResult {
  const reviews = getAllReviews()
  const reviewIndex = reviews.findIndex(r => r.id === reviewId)

  if (reviewIndex === -1) {
    return { success: false, message: 'Review not found' }
  }

  const review = reviews[reviewIndex]

  if (review.userId === userId) {
    return { success: false, message: 'You cannot report your own review' }
  }

  // In real app, store report and handle moderation
  reviews[reviewIndex] = {
    ...review,
    userReported: true,
    status: ReviewStatus.Flagged,
  }

  saveAllReviews(reviews)

  return { success: true, message: 'Review reported successfully' }
}

/**
 * Seed sample reviews for demo purposes
 */
export function seedSampleReviews(templateIds: string[]): void {
  const existingReviews = getAllReviews()
  if (existingReviews.length > 0) return // Don't seed if reviews exist

  const sampleReviews: TemplateReview[] = []
  const sampleUsers = [
    { id: 'user1', name: 'Sarah Johnson' },
    { id: 'user2', name: 'Michael Chen' },
    { id: 'user3', name: 'Emily Rodriguez' },
    { id: 'user4', name: 'David Kim' },
    { id: 'user5', name: 'Jessica Williams' },
  ]

  const sampleContents = [
    { title: 'Excellent automation!', content: 'This template saved me hours every week. The setup was straightforward and the results are consistently reliable. Highly recommend for anyone looking to streamline their workflow.', rating: 5 },
    { title: 'Very helpful workflow', content: 'Great template that does exactly what it promises. Had a minor learning curve initially but once set up it works flawlessly. Would definitely use again.', rating: 4 },
    { title: 'Good but could be better', content: 'The template works well for basic use cases. Documentation could be more detailed. Overall a solid choice that gets the job done.', rating: 3 },
    { title: 'Transformed my workflow', content: 'Cannot believe how much time this saves me. The AI integration is fantastic and the automation is seamless. Best template I have used so far.', rating: 5 },
    { title: 'Solid template', content: 'Does what it says on the tin. Easy to customize and the integrations work well. Support team was helpful when I had questions.', rating: 4 },
  ]

  templateIds.forEach(templateId => {
    // Add 2-4 reviews per template
    const numReviews = Math.floor(Math.random() * 3) + 2
    const shuffledUsers = [...sampleUsers].sort(() => Math.random() - 0.5)
    const shuffledContents = [...sampleContents].sort(() => Math.random() - 0.5)

    for (let i = 0; i < numReviews; i++) {
      const user = shuffledUsers[i]
      const content = shuffledContents[i]
      const daysAgo = Math.floor(Math.random() * 90) + 1
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)

      sampleReviews.push({
        id: generateReviewId(),
        templateId,
        userId: user.id,
        rating: content.rating,
        title: content.title,
        content: content.content,
        helpfulCount: Math.floor(Math.random() * 20),
        verified: Math.random() > 0.2,
        createdAt: createdAt.toISOString(),
        status: ReviewStatus.Published,
        author: {
          id: user.id,
          name: user.name,
          isVerifiedBuyer: Math.random() > 0.3,
        },
      })
    }
  })

  saveAllReviews(sampleReviews)
}

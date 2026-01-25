/**
 * Submission Service
 * Manages template submissions lifecycle including creation, updates, and review submission
 */

import type {
  TemplateSubmission,
  SubmissionFormData,
  SubmissionStatusType,
  SubmissionListOptions,
  SubmissionListResponse,
  SubmissionActionResult,
  ValidationResult,
  SubmissionAuthor,
  ReviewComment,
} from './submission-types'
import { SubmissionStatus, PricingModel } from './submission-types'

// Storage keys
const SUBMISSIONS_STORAGE_KEY = 'nexus_template_submissions'
const SUBMISSION_COUNTER_KEY = 'nexus_submission_counter'

// Generate unique submission ID
function generateSubmissionId(): string {
  const counter = parseInt(localStorage.getItem(SUBMISSION_COUNTER_KEY) || '0', 10) + 1
  localStorage.setItem(SUBMISSION_COUNTER_KEY, counter.toString())
  return `sub_${Date.now()}_${counter}`
}

// Get all submissions from storage
function getStoredSubmissions(): TemplateSubmission[] {
  try {
    const stored = localStorage.getItem(SUBMISSIONS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save submissions to storage
function saveSubmissions(submissions: TemplateSubmission[]): void {
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions))
}

// Get mock current user (in real app, this would come from auth context)
function getCurrentAuthor(): SubmissionAuthor {
  return {
    id: 'user_current',
    name: 'Current User',
    email: 'user@example.com',
    isVerified: true,
    publishedCount: 0,
  }
}

/**
 * Create a new template submission draft
 */
export function createSubmission(
  formData: Partial<SubmissionFormData>
): SubmissionActionResult {
  try {
    const now = new Date().toISOString()
    const author = getCurrentAuthor()

    const submission: TemplateSubmission = {
      id: generateSubmissionId(),
      templateData: {
        id: `template_${Date.now()}`,
        name: formData.name || 'Untitled Template',
        description: formData.description || '',
        category: formData.category || 'other',
        icon: formData.icon || '📦',
        integrations: formData.integrations || [],
        agents: formData.agents || [],
        steps: formData.steps || 1,
        popularity: 0,
        timeSaved: formData.estimatedTimeSaved || '0 hours/week',
        successRate: formData.estimatedSuccessRate || 0,
        isPremium: formData.pricing?.model !== PricingModel.Free,
        isNew: true,
        createdBy: { type: 'community', name: author.name },
        rating: undefined,
        reviewCount: 0,
        usageCount: 0,
      },
      author,
      status: SubmissionStatus.Draft,
      metadata: {
        version: '1.0.0',
        estimatedSetupTime: 15,
        difficulty: 'beginner',
        prerequisites: [],
        screenshots: [],
        ...formData.metadata,
      },
      pricing: formData.pricing || {
        model: PricingModel.Free,
      },
      publishingOptions: formData.publishingOptions || {
        visibility: 'public',
        allowCloning: true,
        showAuthor: true,
        enableRatings: true,
        enableComments: true,
        featuredRequest: false,
        targetAudience: [],
        promotionalTags: [],
      },
      createdAt: now,
      updatedAt: now,
      reviewComments: [],
    }

    const submissions = getStoredSubmissions()
    submissions.push(submission)
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create submission',
    }
  }
}

/**
 * Update an existing submission draft
 */
export function updateSubmission(
  submissionId: string,
  updates: Partial<SubmissionFormData>
): SubmissionActionResult {
  try {
    const submissions = getStoredSubmissions()
    const index = submissions.findIndex((s) => s.id === submissionId)

    if (index === -1) {
      return {
        success: false,
        error: 'Submission not found',
      }
    }

    const submission = submissions[index]

    // Only allow updates to drafts and rejected submissions
    if (
      submission.status !== SubmissionStatus.Draft &&
      submission.status !== SubmissionStatus.Rejected
    ) {
      return {
        success: false,
        error: 'Cannot update submission in current status',
      }
    }

    // Update template data
    if (updates.name !== undefined) submission.templateData.name = updates.name
    if (updates.description !== undefined) submission.templateData.description = updates.description
    if (updates.category !== undefined) submission.templateData.category = updates.category
    if (updates.icon !== undefined) submission.templateData.icon = updates.icon
    if (updates.integrations !== undefined) submission.templateData.integrations = updates.integrations
    if (updates.agents !== undefined) submission.templateData.agents = updates.agents
    if (updates.steps !== undefined) submission.templateData.steps = updates.steps
    if (updates.estimatedTimeSaved !== undefined) submission.templateData.timeSaved = updates.estimatedTimeSaved
    if (updates.estimatedSuccessRate !== undefined) submission.templateData.successRate = updates.estimatedSuccessRate

    // Update pricing
    if (updates.pricing) {
      submission.pricing = updates.pricing
      submission.templateData.isPremium = updates.pricing.model !== PricingModel.Free
    }

    // Update publishing options
    if (updates.publishingOptions) {
      submission.publishingOptions = { ...submission.publishingOptions, ...updates.publishingOptions }
    }

    // Update metadata
    if (updates.metadata) {
      submission.metadata = { ...submission.metadata, ...updates.metadata }
    }

    submission.updatedAt = new Date().toISOString()

    // Reset status if previously rejected
    if (submission.status === SubmissionStatus.Rejected) {
      submission.status = SubmissionStatus.Draft
    }

    submissions[index] = submission
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update submission',
    }
  }
}

/**
 * Validate a submission before submitting for review
 */
export function validateSubmission(submission: TemplateSubmission): ValidationResult {
  const errors: ValidationResult['errors'] = []
  const warnings: ValidationResult['warnings'] = []

  // Required field validations
  if (!submission.templateData.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'Template name is required',
      code: 'REQUIRED_FIELD',
    })
  } else if (submission.templateData.name.length < 3) {
    errors.push({
      field: 'name',
      message: 'Template name must be at least 3 characters',
      code: 'MIN_LENGTH',
    })
  } else if (submission.templateData.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Template name must be less than 100 characters',
      code: 'MAX_LENGTH',
    })
  }

  if (!submission.templateData.description?.trim()) {
    errors.push({
      field: 'description',
      message: 'Description is required',
      code: 'REQUIRED_FIELD',
    })
  } else if (submission.templateData.description.length < 20) {
    warnings.push({
      field: 'description',
      message: 'Consider adding a more detailed description',
      suggestion: 'Templates with detailed descriptions get more downloads',
    })
  }

  if (!submission.templateData.category) {
    errors.push({
      field: 'category',
      message: 'Category is required',
      code: 'REQUIRED_FIELD',
    })
  }

  // Integration validations
  if (!submission.templateData.integrations?.length) {
    warnings.push({
      field: 'integrations',
      message: 'No integrations specified',
      suggestion: 'Templates with integrations are more discoverable',
    })
  }

  // Agent validations
  if (!submission.templateData.agents?.length) {
    warnings.push({
      field: 'agents',
      message: 'No AI agents specified',
      suggestion: 'Consider adding AI agents to make your template more powerful',
    })
  }

  // Steps validation
  if (!submission.templateData.steps || submission.templateData.steps < 1) {
    errors.push({
      field: 'steps',
      message: 'Template must have at least one step',
      code: 'MIN_VALUE',
    })
  }

  // Pricing validation
  if (submission.pricing.model !== 'free' && !submission.pricing.price) {
    errors.push({
      field: 'pricing.price',
      message: 'Price is required for paid templates',
      code: 'REQUIRED_FIELD',
    })
  }

  // Metadata validations
  if (!submission.metadata.estimatedSetupTime) {
    warnings.push({
      field: 'estimatedSetupTime',
      message: 'Consider adding estimated setup time',
      suggestion: 'Users appreciate knowing how long setup takes',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Submit a draft for review
 */
export function submitForReview(submissionId: string): SubmissionActionResult {
  try {
    const submissions = getStoredSubmissions()
    const index = submissions.findIndex((s) => s.id === submissionId)

    if (index === -1) {
      return {
        success: false,
        error: 'Submission not found',
      }
    }

    const submission = submissions[index]

    // Validate before submitting
    const validationResult = validateSubmission(submission)
    if (!validationResult.isValid) {
      return {
        success: false,
        error: 'Submission validation failed',
        validationResult,
      }
    }

    // Check current status
    if (
      submission.status !== SubmissionStatus.Draft &&
      submission.status !== SubmissionStatus.Rejected
    ) {
      return {
        success: false,
        error: 'Submission is not in a valid state for review',
      }
    }

    const now = new Date().toISOString()
    submission.status = SubmissionStatus.Pending
    submission.submittedAt = now
    submission.updatedAt = now
    submission.validationResult = validationResult

    submissions[index] = submission
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
      validationResult,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit for review',
    }
  }
}

/**
 * Get submission status
 */
export function getSubmissionStatus(submissionId: string): SubmissionStatusType | null {
  const submissions = getStoredSubmissions()
  const submission = submissions.find((s) => s.id === submissionId)
  return submission?.status || null
}

/**
 * Get a single submission by ID
 */
export function getSubmission(submissionId: string): TemplateSubmission | null {
  const submissions = getStoredSubmissions()
  return submissions.find((s) => s.id === submissionId) || null
}

/**
 * Get all submissions for the current user
 */
export function getMySubmissions(options?: SubmissionListOptions): SubmissionListResponse {
  const author = getCurrentAuthor()
  let submissions = getStoredSubmissions().filter((s) => s.author.id === author.id)

  // Apply filters
  if (options?.filters) {
    const { status, category, dateRange, searchQuery } = options.filters

    if (status?.length) {
      submissions = submissions.filter((s) => status.includes(s.status))
    }

    if (category?.length) {
      submissions = submissions.filter((s) =>
        s.templateData.category && category.includes(s.templateData.category as any)
      )
    }

    if (dateRange) {
      const start = new Date(dateRange.start).getTime()
      const end = new Date(dateRange.end).getTime()
      submissions = submissions.filter((s) => {
        const created = new Date(s.createdAt).getTime()
        return created >= start && created <= end
      })
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      submissions = submissions.filter(
        (s) =>
          s.templateData.name?.toLowerCase().includes(query) ||
          s.templateData.description?.toLowerCase().includes(query)
      )
    }
  }

  // Apply sorting
  const sortBy = options?.sortBy || 'updated_at'
  const sortOrder = options?.sortOrder || 'desc'

  submissions.sort((a, b) => {
    let aVal: string | number
    let bVal: string | number

    switch (sortBy) {
      case 'created_at':
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
        break
      case 'updated_at':
        aVal = new Date(a.updatedAt).getTime()
        bVal = new Date(b.updatedAt).getTime()
        break
      case 'submitted_at':
        aVal = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        bVal = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        break
      case 'name':
        aVal = a.templateData.name?.toLowerCase() || ''
        bVal = b.templateData.name?.toLowerCase() || ''
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      default:
        aVal = new Date(a.updatedAt).getTime()
        bVal = new Date(b.updatedAt).getTime()
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

  // Apply pagination
  const page = options?.page || 1
  const limit = options?.limit || 10
  const startIndex = (page - 1) * limit
  const paginatedSubmissions = submissions.slice(startIndex, startIndex + limit)

  return {
    submissions: paginatedSubmissions,
    total: submissions.length,
    page,
    limit,
    hasMore: startIndex + limit < submissions.length,
  }
}

/**
 * Delete a submission (only drafts can be deleted)
 */
export function deleteSubmission(submissionId: string): SubmissionActionResult {
  try {
    const submissions = getStoredSubmissions()
    const index = submissions.findIndex((s) => s.id === submissionId)

    if (index === -1) {
      return {
        success: false,
        error: 'Submission not found',
      }
    }

    const submission = submissions[index]

    // Only allow deletion of drafts
    if (submission.status !== SubmissionStatus.Draft) {
      return {
        success: false,
        error: 'Only draft submissions can be deleted',
      }
    }

    submissions.splice(index, 1)
    saveSubmissions(submissions)

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete submission',
    }
  }
}

/**
 * Add a review comment to a submission
 */
export function addReviewComment(
  submissionId: string,
  comment: Omit<ReviewComment, 'id' | 'submissionId' | 'createdAt'>
): SubmissionActionResult {
  try {
    const submissions = getStoredSubmissions()
    const index = submissions.findIndex((s) => s.id === submissionId)

    if (index === -1) {
      return {
        success: false,
        error: 'Submission not found',
      }
    }

    const submission = submissions[index]

    const newComment: ReviewComment = {
      ...comment,
      id: `comment_${Date.now()}`,
      submissionId,
      createdAt: new Date().toISOString(),
    }

    submission.reviewComments.push(newComment)
    submission.updatedAt = new Date().toISOString()

    submissions[index] = submission
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add review comment',
    }
  }
}

/**
 * Get submission statistics for the current user
 */
export function getSubmissionStats(): {
  total: number
  byStatus: Record<SubmissionStatusType, number>
  totalViews: number
  totalDownloads: number
} {
  const submissions = getMySubmissions({ limit: 1000 }).submissions

  const byStatus: Record<SubmissionStatusType, number> = {
    draft: 0,
    pending: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    published: 0,
  }

  let totalViews = 0
  let totalDownloads = 0

  for (const submission of submissions) {
    byStatus[submission.status]++
    if (submission.analytics) {
      totalViews += submission.analytics.views
      totalDownloads += submission.analytics.downloads
    }
  }

  return {
    total: submissions.length,
    byStatus,
    totalViews,
    totalDownloads,
  }
}

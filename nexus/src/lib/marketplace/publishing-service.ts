/**
 * Publishing Service
 * Manages the template publishing workflow including validation, preparation, and lifecycle
 */

import type {
  TemplateSubmission,
  ValidationResult,
  PublishingOptions,
  SubmissionActionResult,
} from './submission-types'
import { SubmissionStatus } from './submission-types'
import type { WorkflowTemplate } from '@/components/TemplatesMarketplace'

// Storage keys
const SUBMISSIONS_STORAGE_KEY = 'nexus_template_submissions'
const PUBLISHED_TEMPLATES_KEY = 'nexus_published_templates'

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

// Get published templates from storage
function getPublishedTemplates(): WorkflowTemplate[] {
  try {
    const stored = localStorage.getItem(PUBLISHED_TEMPLATES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save published templates
function savePublishedTemplates(templates: WorkflowTemplate[]): void {
  localStorage.setItem(PUBLISHED_TEMPLATES_KEY, JSON.stringify(templates))
}

/**
 * Validate a template before publishing
 * Performs comprehensive checks on template data, metadata, and publishing options
 */
export function validateTemplate(submission: TemplateSubmission): ValidationResult {
  const errors: ValidationResult['errors'] = []
  const warnings: ValidationResult['warnings'] = []

  // Check submission status
  if (submission.status !== SubmissionStatus.Approved) {
    errors.push({
      field: 'status',
      message: 'Template must be approved before publishing',
      code: 'NOT_APPROVED',
    })
  }

  // Validate template data completeness
  const { templateData } = submission

  if (!templateData.name?.trim()) {
    errors.push({
      field: 'templateData.name',
      message: 'Template name is required',
      code: 'REQUIRED_FIELD',
    })
  }

  if (!templateData.description?.trim()) {
    errors.push({
      field: 'templateData.description',
      message: 'Template description is required',
      code: 'REQUIRED_FIELD',
    })
  }

  if (!templateData.category) {
    errors.push({
      field: 'templateData.category',
      message: 'Template category is required',
      code: 'REQUIRED_FIELD',
    })
  }

  if (!templateData.icon) {
    warnings.push({
      field: 'templateData.icon',
      message: 'No icon specified',
      suggestion: 'Add an icon to make your template more visually appealing',
    })
  }

  // Validate integrations
  if (!templateData.integrations?.length) {
    warnings.push({
      field: 'templateData.integrations',
      message: 'No integrations specified',
      suggestion: 'Templates with integrations are more useful to users',
    })
  }

  // Validate agents
  if (!templateData.agents?.length) {
    warnings.push({
      field: 'templateData.agents',
      message: 'No AI agents specified',
      suggestion: 'Consider adding AI agents for enhanced functionality',
    })
  }

  // Validate steps
  if (!templateData.steps || templateData.steps < 1) {
    errors.push({
      field: 'templateData.steps',
      message: 'Template must have at least one step',
      code: 'INVALID_VALUE',
    })
  }

  // Validate metadata
  if (!submission.metadata.version) {
    errors.push({
      field: 'metadata.version',
      message: 'Version is required',
      code: 'REQUIRED_FIELD',
    })
  }

  if (!submission.metadata.difficulty) {
    warnings.push({
      field: 'metadata.difficulty',
      message: 'Difficulty level not specified',
      suggestion: 'Setting difficulty helps users find appropriate templates',
    })
  }

  if (!submission.metadata.estimatedSetupTime) {
    warnings.push({
      field: 'metadata.estimatedSetupTime',
      message: 'Estimated setup time not specified',
      suggestion: 'Users appreciate knowing how long setup takes',
    })
  }

  // Validate pricing for paid templates
  if (submission.pricing.model !== 'free') {
    if (!submission.pricing.price || submission.pricing.price <= 0) {
      errors.push({
        field: 'pricing.price',
        message: 'Valid price is required for paid templates',
        code: 'INVALID_VALUE',
      })
    }

    if (!submission.pricing.currency) {
      warnings.push({
        field: 'pricing.currency',
        message: 'Currency not specified, defaulting to USD',
        suggestion: 'Specify currency for clarity',
      })
    }
  }

  // Validate publishing options
  if (!submission.publishingOptions) {
    errors.push({
      field: 'publishingOptions',
      message: 'Publishing options are required',
      code: 'REQUIRED_FIELD',
    })
  }

  // Check for screenshots (recommended)
  if (!submission.metadata.screenshots?.length) {
    warnings.push({
      field: 'metadata.screenshots',
      message: 'No screenshots provided',
      suggestion: 'Adding screenshots increases download rates by 40%',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Prepare a template for publishing
 * Generates final template data with all required fields
 */
export function prepareForPublish(
  submission: TemplateSubmission
): { template: WorkflowTemplate; validation: ValidationResult } {
  const validation = validateTemplate(submission)

  // Even if not valid, prepare the template data structure
  const template: WorkflowTemplate = {
    id: submission.templateData.id || `pub_${submission.id}`,
    name: submission.templateData.name || 'Untitled Template',
    description: submission.templateData.description || '',
    category: submission.templateData.category || 'other',
    icon: submission.templateData.icon || '📦',
    popularity: 0,
    timeSaved: submission.templateData.timeSaved || '0 hours/week',
    successRate: submission.templateData.successRate || 0,
    integrations: submission.templateData.integrations || [],
    steps: submission.templateData.steps || 1,
    agents: submission.templateData.agents || [],
    isPremium: submission.pricing.model !== 'free',
    isFeatured: submission.publishingOptions.featuredRequest && validation.isValid,
    isNew: true,
    rating: undefined,
    reviewCount: 0,
    usageCount: 0,
    createdBy: {
      type: 'community',
      name: submission.publishingOptions.showAuthor ? submission.author.name : undefined,
    },
  }

  return { template, validation }
}

/**
 * Publish a template to the marketplace
 */
export function publishTemplate(submissionId: string): SubmissionActionResult {
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

    // Prepare and validate
    const { template, validation } = prepareForPublish(submission)

    if (!validation.isValid) {
      return {
        success: false,
        error: 'Template validation failed',
        validationResult: validation,
      }
    }

    // Add to published templates
    const publishedTemplates = getPublishedTemplates()

    // Check for duplicate
    const existingIndex = publishedTemplates.findIndex(
      (t) => t.id === template.id || t.name === template.name
    )

    if (existingIndex !== -1) {
      // Update existing
      publishedTemplates[existingIndex] = {
        ...publishedTemplates[existingIndex],
        ...template,
        isNew: false, // Not new if updating
      }
    } else {
      // Add new
      publishedTemplates.push(template)
    }

    savePublishedTemplates(publishedTemplates)

    // Update submission status
    const now = new Date().toISOString()
    submission.status = SubmissionStatus.Published
    submission.publishedAt = now
    submission.updatedAt = now
    submission.templateData = template
    submission.analytics = {
      views: 0,
      downloads: 0,
      favorites: 0,
      rating: 0,
      ratingCount: 0,
    }

    submissions[index] = submission
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
      validationResult: validation,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish template',
    }
  }
}

/**
 * Unpublish a template from the marketplace
 */
export function unpublishTemplate(submissionId: string): SubmissionActionResult {
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

    if (submission.status !== SubmissionStatus.Published) {
      return {
        success: false,
        error: 'Template is not currently published',
      }
    }

    // Remove from published templates
    const publishedTemplates = getPublishedTemplates()
    const templateIndex = publishedTemplates.findIndex(
      (t) => t.id === submission.templateData.id
    )

    if (templateIndex !== -1) {
      publishedTemplates.splice(templateIndex, 1)
      savePublishedTemplates(publishedTemplates)
    }

    // Update submission status back to approved
    submission.status = SubmissionStatus.Approved
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
      error: error instanceof Error ? error.message : 'Failed to unpublish template',
    }
  }
}

/**
 * Update a published template
 * Creates a new version and updates the live template
 */
export function updatePublishedTemplate(
  submissionId: string,
  updates: {
    templateData?: Partial<WorkflowTemplate>
    metadata?: Partial<TemplateSubmission['metadata']>
    publishingOptions?: Partial<PublishingOptions>
  }
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

    if (submission.status !== SubmissionStatus.Published) {
      return {
        success: false,
        error: 'Template is not currently published',
      }
    }

    // Update template data
    if (updates.templateData) {
      submission.templateData = {
        ...submission.templateData,
        ...updates.templateData,
        isNew: false, // Updates are not "new"
      }
    }

    // Update metadata
    if (updates.metadata) {
      // Increment version if not specified
      const currentVersion = submission.metadata.version || '1.0.0'
      const [major, minor, patch] = currentVersion.split('.').map(Number)
      const newVersion = updates.metadata.version || `${major}.${minor}.${patch + 1}`

      submission.metadata = {
        ...submission.metadata,
        ...updates.metadata,
        version: newVersion,
        previousVersionId: submission.id,
        changelog: updates.metadata.changelog || `Updated to version ${newVersion}`,
      }
    }

    // Update publishing options
    if (updates.publishingOptions) {
      submission.publishingOptions = {
        ...submission.publishingOptions,
        ...updates.publishingOptions,
      }
    }

    submission.updatedAt = new Date().toISOString()

    // Validate the updated template
    const validation = validateTemplate(submission)
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Updated template validation failed',
        validationResult: validation,
      }
    }

    // Update in published templates
    const publishedTemplates = getPublishedTemplates()
    const templateIndex = publishedTemplates.findIndex(
      (t) => t.id === submission.templateData.id
    )

    if (templateIndex !== -1) {
      publishedTemplates[templateIndex] = submission.templateData as WorkflowTemplate
      savePublishedTemplates(publishedTemplates)
    }

    submissions[index] = submission
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
      validationResult: validation,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update published template',
    }
  }
}

/**
 * Get all published templates
 */
export function getAllPublishedTemplates(): WorkflowTemplate[] {
  return getPublishedTemplates()
}

/**
 * Get published templates by author
 */
export function getPublishedTemplatesByAuthor(authorId: string): WorkflowTemplate[] {
  const submissions = getStoredSubmissions().filter(
    (s) => s.author.id === authorId && s.status === SubmissionStatus.Published
  )
  return submissions.map((s) => s.templateData as WorkflowTemplate)
}

/**
 * Record template analytics event
 */
export function recordAnalyticsEvent(
  submissionId: string,
  event: 'view' | 'download' | 'favorite' | 'unfavorite'
): void {
  try {
    const submissions = getStoredSubmissions()
    const index = submissions.findIndex((s) => s.id === submissionId)

    if (index === -1 || submissions[index].status !== SubmissionStatus.Published) {
      return
    }

    const submission = submissions[index]
    if (!submission.analytics) {
      submission.analytics = {
        views: 0,
        downloads: 0,
        favorites: 0,
        rating: 0,
        ratingCount: 0,
      }
    }

    switch (event) {
      case 'view':
        submission.analytics.views++
        break
      case 'download':
        submission.analytics.downloads++
        break
      case 'favorite':
        submission.analytics.favorites++
        break
      case 'unfavorite':
        submission.analytics.favorites = Math.max(0, submission.analytics.favorites - 1)
        break
    }

    submissions[index] = submission
    saveSubmissions(submissions)
  } catch {
    // Silently fail for analytics
  }
}

/**
 * Record a rating for a published template
 */
export function recordRating(submissionId: string, rating: number): SubmissionActionResult {
  try {
    if (rating < 1 || rating > 5) {
      return {
        success: false,
        error: 'Rating must be between 1 and 5',
      }
    }

    const submissions = getStoredSubmissions()
    const index = submissions.findIndex((s) => s.id === submissionId)

    if (index === -1) {
      return {
        success: false,
        error: 'Submission not found',
      }
    }

    const submission = submissions[index]

    if (submission.status !== SubmissionStatus.Published) {
      return {
        success: false,
        error: 'Can only rate published templates',
      }
    }

    if (!submission.analytics) {
      submission.analytics = {
        views: 0,
        downloads: 0,
        favorites: 0,
        rating: 0,
        ratingCount: 0,
      }
    }

    // Calculate new average rating
    const { rating: currentRating, ratingCount } = submission.analytics
    const newRatingCount = ratingCount + 1
    const newRating = (currentRating * ratingCount + rating) / newRatingCount

    submission.analytics.rating = Math.round(newRating * 10) / 10 // Round to 1 decimal
    submission.analytics.ratingCount = newRatingCount

    // Update template data rating as well
    submission.templateData.rating = submission.analytics.rating
    submission.templateData.reviewCount = newRatingCount

    // Update in published templates
    const publishedTemplates = getPublishedTemplates()
    const templateIndex = publishedTemplates.findIndex(
      (t) => t.id === submission.templateData.id
    )

    if (templateIndex !== -1) {
      publishedTemplates[templateIndex].rating = submission.analytics.rating
      publishedTemplates[templateIndex].reviewCount = newRatingCount
      savePublishedTemplates(publishedTemplates)
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
      error: error instanceof Error ? error.message : 'Failed to record rating',
    }
  }
}

/**
 * Approve a submission (admin/reviewer function)
 * In a real app, this would require authentication and authorization
 */
export function approveSubmission(
  submissionId: string,
  reviewerId: string,
  reviewerName: string,
  comments?: string
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

    if (
      submission.status !== SubmissionStatus.Pending &&
      submission.status !== SubmissionStatus.InReview
    ) {
      return {
        success: false,
        error: 'Submission is not pending review',
      }
    }

    const now = new Date().toISOString()

    // Add approval comment
    if (comments) {
      submission.reviewComments.push({
        id: `comment_${Date.now()}`,
        submissionId,
        reviewerId,
        reviewerName,
        comment: comments,
        type: 'approval',
        createdAt: now,
      })
    }

    submission.status = SubmissionStatus.Approved
    submission.reviewedAt = now
    submission.updatedAt = now
    submission.assignedReviewer = reviewerId

    submissions[index] = submission
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve submission',
    }
  }
}

/**
 * Reject a submission (admin/reviewer function)
 */
export function rejectSubmission(
  submissionId: string,
  reviewerId: string,
  reviewerName: string,
  reason: string
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

    if (
      submission.status !== SubmissionStatus.Pending &&
      submission.status !== SubmissionStatus.InReview
    ) {
      return {
        success: false,
        error: 'Submission is not pending review',
      }
    }

    const now = new Date().toISOString()

    // Add rejection comment
    submission.reviewComments.push({
      id: `comment_${Date.now()}`,
      submissionId,
      reviewerId,
      reviewerName,
      comment: reason,
      type: 'rejection',
      createdAt: now,
    })

    submission.status = SubmissionStatus.Rejected
    submission.reviewedAt = now
    submission.updatedAt = now
    submission.assignedReviewer = reviewerId

    submissions[index] = submission
    saveSubmissions(submissions)

    return {
      success: true,
      submission,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject submission',
    }
  }
}

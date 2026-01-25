/**
 * Template Submission Types
 * Defines types for the template submission, review, and publishing workflow
 */

import type { WorkflowTemplate } from '@/components/TemplatesMarketplace'

// Submission status values
export const SubmissionStatus = {
  Draft: 'draft',
  Pending: 'pending',
  InReview: 'in_review',
  Approved: 'approved',
  Rejected: 'rejected',
  Published: 'published',
} as const

export type SubmissionStatusType = typeof SubmissionStatus[keyof typeof SubmissionStatus]

// Pricing model types
export const PricingModel = {
  Free: 'free',
  OneTime: 'one_time',
  Subscription: 'subscription',
} as const

export type PricingModelType = typeof PricingModel[keyof typeof PricingModel]

// Template categories available for submission
export const TemplateCategory = {
  Marketing: 'marketing',
  Sales: 'sales',
  Operations: 'operations',
  HR: 'hr',
  Development: 'development',
  Finance: 'finance',
  Customer: 'customer',
  Meetings: 'meetings',
  Healthcare: 'healthcare',
  Legal: 'legal',
  RealEstate: 'real-estate',
  Education: 'education',
  DevOps: 'devops',
  Other: 'other',
} as const

export type TemplateCategoryType = typeof TemplateCategory[keyof typeof TemplateCategory]

// Author information
export interface SubmissionAuthor {
  id: string
  name: string
  email: string
  avatarUrl?: string
  isVerified?: boolean
  publishedCount?: number
}

// Pricing configuration
export interface PricingConfig {
  model: PricingModelType
  price?: number
  currency?: string
  subscriptionPeriod?: 'monthly' | 'yearly'
}

// Review comment from reviewers
export interface ReviewComment {
  id: string
  submissionId: string
  reviewerId: string
  reviewerName: string
  comment: string
  type: 'feedback' | 'request_change' | 'approval' | 'rejection'
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

// Submission validation result
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Publishing options
export interface PublishingOptions {
  visibility: 'public' | 'private' | 'unlisted'
  allowCloning: boolean
  showAuthor: boolean
  enableRatings: boolean
  enableComments: boolean
  featuredRequest: boolean
  targetAudience: string[]
  promotionalTags: string[]
}

// Template submission metadata
export interface SubmissionMetadata {
  version: string
  changelog?: string
  previousVersionId?: string
  estimatedSetupTime: number // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites: string[]
  supportEmail?: string
  documentationUrl?: string
  demoVideoUrl?: string
  screenshots: string[]
}

// Main template submission interface
export interface TemplateSubmission {
  id: string
  templateData: Partial<WorkflowTemplate>
  author: SubmissionAuthor
  status: SubmissionStatusType
  metadata: SubmissionMetadata
  pricing: PricingConfig
  publishingOptions: PublishingOptions

  // Timestamps
  createdAt: string
  updatedAt: string
  submittedAt?: string
  reviewedAt?: string
  publishedAt?: string

  // Review data
  reviewComments: ReviewComment[]
  assignedReviewer?: string
  reviewScore?: number

  // Validation
  validationResult?: ValidationResult

  // Analytics (post-publish)
  analytics?: {
    views: number
    downloads: number
    favorites: number
    rating: number
    ratingCount: number
  }
}

// Form data for creating/editing submissions
export interface SubmissionFormData {
  // Basic Info
  name: string
  description: string
  category: TemplateCategoryType
  icon: string
  tags: string[]

  // Template Configuration
  integrations: string[]
  agents: string[]
  steps: number

  // Metrics (estimated)
  estimatedTimeSaved: string
  estimatedSuccessRate: number

  // Pricing
  pricing: PricingConfig

  // Publishing Options
  publishingOptions: PublishingOptions

  // Metadata
  metadata: Partial<SubmissionMetadata>
}

// Submission list filters
export interface SubmissionFilters {
  status?: SubmissionStatusType[]
  category?: TemplateCategoryType[]
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
}

// Submission list sort options
export const SubmissionSortBy = {
  CreatedAt: 'created_at',
  UpdatedAt: 'updated_at',
  SubmittedAt: 'submitted_at',
  Name: 'name',
  Status: 'status',
} as const

export type SubmissionSortByType = typeof SubmissionSortBy[keyof typeof SubmissionSortBy]

export interface SubmissionListOptions {
  filters?: SubmissionFilters
  sortBy?: SubmissionSortByType
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// API Response types
export interface SubmissionListResponse {
  submissions: TemplateSubmission[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface SubmissionActionResult {
  success: boolean
  submission?: TemplateSubmission
  error?: string
  validationResult?: ValidationResult
}

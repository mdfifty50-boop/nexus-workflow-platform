/**
 * Marketplace Module Exports
 *
 * Central export point for all marketplace-related functionality.
 */

// Types
export {
  MarketplaceCategory,
  TemplateSort,
  PriceTier,
  CategoryDisplay,
  SortDisplay,
  isMarketplaceCategory,
  isTemplateSort,
  isPriceTier,
} from './marketplace-types'

export type {
  MarketplaceCategoryType,
  TemplateSortType,
  PriceTierType,
  TemplateAuthor,
  TemplatePricing,
  TemplateStats,
  MarketplaceTemplate,
  PriceRange,
  TemplateFilter,
  PaginationInfo,
  SearchResult,
  SearchParams,
  TemplateCollection,
} from './marketplace-types'

// Filter Types
export {
  CATEGORY_IDS,
  SORT_OPTIONS,
  PRICE_TIERS,
  CREATOR_TYPES,
  DEFAULT_FILTER_STATE,
} from './types'

export type {
  CategoryId,
  Category,
  CategoryStats,
  SortOption,
  PriceTier as FilterPriceTier,
  CreatorType,
  FilterState,
  FilterValidationResult,
  Tag,
  TagSuggestion,
  SearchSuggestion,
  SearchHistory,
} from './types'

// Search Service
export {
  searchTemplates,
  getTemplatesByCategory,
  getPopularTemplates,
  getRecentTemplates,
  getFeaturedTemplates,
  getSuggestedTemplates,
  getTemplateById,
  getAllTags,
  getAllIntegrations,
  mockTemplates,
} from './template-search-service'

// Category Service
export {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  getCategories,
  getCategoryById,
  getCategoryIcon,
  getCategoryColor,
  getCategoryHierarchy,
  getAllCategoriesFlat,
  getCategoryStats,
  searchCategories,
  getSuggestedCategories,
  getCategoryBgClass,
  getCategoryTextClass,
  getCategoryBorderClass,
} from './category-service'

// Filter Service
export {
  buildFilterQuery,
  combineFilters,
  serializeFilterToUrl,
  parseFilterFromUrl,
  validateFilter,
  hasActiveFilters,
  countActiveFilters,
  getFilterSummary,
  removeFilterValue,
  resetFilter,
} from './filter-service'

// Tag Service
export {
  normalizeTag,
  createTag,
  getAllTags as getAllMarketplaceTags,
  getPopularTags,
  getPopularTagsByCategory,
  searchTags,
  getRelatedTags,
  getTagSuggestions,
  getTrendingTags,
  recordTagUsage,
  getRecentTagSearches,
  isValidTag,
  getTagBySlug,
  formatTagDisplay,
  getIntegrationTags,
} from './tag-service'

// Cache
export {
  TemplateCache,
  templateCache,
  invalidateAllTemplateCache,
  invalidateSearchCache,
  invalidateSuggestionsCache,
  invalidateFeaturedCache,
  CacheTTL,
} from './template-cache'

// Review Types
export {
  ReviewSortType,
  ReviewStatus,
  DEFAULT_REVIEW_PAGE_SIZE,
  MAX_REVIEW_CONTENT_LENGTH,
  MAX_REVIEW_TITLE_LENGTH,
  MIN_REVIEW_CONTENT_LENGTH,
  RATING_LABELS,
  getRatingLabel,
  isValidRating,
  formatReviewDate,
} from './review-types'

export type {
  TemplateReview,
  ReviewAuthor,
  ReviewResponse,
  ReviewStats,
  RatingDistribution,
  CreateReviewInput,
  UpdateReviewInput,
  PaginatedReviews,
  ReviewFilters,
  ReviewActionResult,
  ReviewSortTypeValue,
  ReviewStatusValue,
} from './review-types'

// Review Service
export {
  createReview,
  updateReview,
  deleteReview,
  getTemplateReviews,
  getUserReviews,
  markHelpful,
  getReviewById,
  canUserReview,
  getUserReviewForTemplate,
  reportReview,
  hasUserVotedHelpful,
  seedSampleReviews,
} from './review-service'

// Rating Service
export {
  calculateAverageRating,
  getRatingDistribution,
  calculateReviewStats,
  getTemplateRatingStats,
  updateTemplateRating,
  getTopRatedTemplates,
  sortTemplatesByRating,
  getRatingPercentages,
  isHighlyRated,
  getRatingTier,
  clearRatingCache,
  invalidateTemplateRatingCache,
} from './rating-service'

// Submission Types
export {
  SubmissionStatus,
  PricingModel,
  TemplateCategory,
  SubmissionSortBy,
} from './submission-types'

export type {
  TemplateSubmission,
  SubmissionStatusType,
  SubmissionFormData,
  SubmissionAuthor,
  PricingConfig,
  PublishingOptions,
  ReviewComment as SubmissionReviewComment,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SubmissionMetadata,
  SubmissionFilters,
  SubmissionListOptions,
  SubmissionListResponse,
  SubmissionActionResult,
  TemplateCategoryType,
  PricingModelType,
  SubmissionSortByType,
} from './submission-types'

// Submission Service
export {
  createSubmission,
  updateSubmission,
  submitForReview,
  getSubmissionStatus,
  getSubmission,
  getMySubmissions,
  deleteSubmission,
  addReviewComment as addSubmissionReviewComment,
  getSubmissionStats,
  validateSubmission,
} from './submission-service'

// Publishing Service
export {
  validateTemplate,
  prepareForPublish,
  publishTemplate,
  unpublishTemplate,
  updatePublishedTemplate,
  getAllPublishedTemplates,
  getPublishedTemplatesByAuthor,
  recordAnalyticsEvent,
  recordRating,
  approveSubmission,
  rejectSubmission,
} from './publishing-service'

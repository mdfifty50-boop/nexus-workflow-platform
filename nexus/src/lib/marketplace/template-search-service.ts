/**
 * Template Search Service
 *
 * Provides search, filtering, and recommendation functionality
 * for the template marketplace.
 */

import type {
  MarketplaceTemplate,
  MarketplaceCategoryType,
  TemplateSortType,
  TemplateFilter,
  SearchResult,
  SearchParams,
  PaginationInfo,
} from './marketplace-types'

import {
  MarketplaceCategory,
  TemplateSort,
  PriceTier,
} from './marketplace-types'

import { templateCache } from './template-cache'

// =============================================================================
// MOCK DATA - Replace with actual API calls
// =============================================================================

const MOCK_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'mp-email-automation',
    name: 'Smart Email Automation',
    description: 'Automatically send personalized follow-up emails based on recipient behavior and engagement patterns. Uses AI to craft compelling messages.',
    shortDescription: 'AI-powered email follow-ups',
    author: { id: 'nexus', name: 'Nexus Team', type: 'nexus', verified: true },
    category: MarketplaceCategory.MARKETING,
    tags: ['email', 'automation', 'ai', 'marketing', 'follow-up'],
    pricing: { tier: PriceTier.FREE, price: 0, currency: 'USD' },
    stats: { downloads: 15420, rating: 4.8, reviewCount: 342, activeUsers: 8900, lastUpdated: '2025-01-10' },
    icon: '📧',
    integrations: ['Gmail', 'Outlook', 'Mailchimp', 'HubSpot'],
    steps: 5,
    agents: ['mary', 'sam'],
    estimatedTimeSaved: '8 hours/week',
    successRate: 96,
    featured: true,
    isNew: false,
    isPremium: false,
    createdAt: '2024-06-15',
    updatedAt: '2025-01-10',
    version: '2.1.0',
  },
  {
    id: 'mp-crm-lead-scoring',
    name: 'AI Lead Scoring System',
    description: 'Score and prioritize leads automatically using AI analysis of behavior, firmographics, and engagement signals.',
    shortDescription: 'Intelligent lead prioritization',
    author: { id: 'nexus', name: 'Nexus Team', type: 'nexus', verified: true },
    category: MarketplaceCategory.SALES,
    tags: ['crm', 'leads', 'scoring', 'ai', 'sales'],
    pricing: { tier: PriceTier.STARTER, price: 29, currency: 'USD' },
    stats: { downloads: 8750, rating: 4.9, reviewCount: 189, activeUsers: 4200, lastUpdated: '2025-01-08' },
    icon: '🎯',
    integrations: ['Salesforce', 'HubSpot', 'Pipedrive'],
    steps: 6,
    agents: ['larry', 'sam'],
    estimatedTimeSaved: '12 hours/week',
    successRate: 94,
    featured: true,
    isNew: false,
    isPremium: true,
    createdAt: '2024-08-20',
    updatedAt: '2025-01-08',
    version: '1.8.0',
  },
  {
    id: 'mp-invoice-processing',
    name: 'Invoice Processing AI',
    description: 'Extract data from invoices, match to purchase orders, and auto-post to general ledger with intelligent validation.',
    shortDescription: 'Automated invoice handling',
    author: { id: 'partner-1', name: 'FinOps Partners', type: 'partner', verified: true },
    category: MarketplaceCategory.FINANCE,
    tags: ['invoice', 'finance', 'ocr', 'accounting', 'automation'],
    pricing: { tier: PriceTier.PRO, price: 79, currency: 'USD' },
    stats: { downloads: 5620, rating: 4.7, reviewCount: 145, activeUsers: 2800, lastUpdated: '2025-01-05' },
    icon: '🧾',
    integrations: ['QuickBooks', 'Xero', 'SAP', 'NetSuite'],
    steps: 7,
    agents: ['alex', 'olivia'],
    estimatedTimeSaved: '15 hours/week',
    successRate: 97,
    featured: false,
    isNew: false,
    isPremium: true,
    createdAt: '2024-09-10',
    updatedAt: '2025-01-05',
    version: '1.5.0',
  },
  {
    id: 'mp-social-scheduler',
    name: 'Social Media Command Center',
    description: 'Plan, create, and schedule content across all social platforms with AI-generated captions and optimal timing.',
    shortDescription: 'Multi-platform social scheduling',
    author: { id: 'community-1', name: 'SocialPro', type: 'community' },
    category: MarketplaceCategory.MARKETING,
    tags: ['social', 'content', 'scheduling', 'marketing', 'instagram', 'linkedin'],
    pricing: { tier: PriceTier.FREE, price: 0, currency: 'USD' },
    stats: { downloads: 12300, rating: 4.6, reviewCount: 278, activeUsers: 6500, lastUpdated: '2025-01-12' },
    icon: '📱',
    integrations: ['LinkedIn', 'Twitter', 'Instagram', 'Buffer', 'Hootsuite'],
    steps: 4,
    agents: ['emma', 'mary'],
    estimatedTimeSaved: '10 hours/week',
    successRate: 92,
    featured: false,
    isNew: true,
    isPremium: false,
    createdAt: '2024-12-28',
    updatedAt: '2025-01-12',
    version: '1.0.0',
  },
  {
    id: 'mp-candidate-screening',
    name: 'AI Candidate Screening',
    description: 'Screen resumes, rank candidates, and schedule interviews automatically with fair, unbiased AI evaluation.',
    shortDescription: 'Smart recruitment automation',
    author: { id: 'nexus', name: 'Nexus Team', type: 'nexus', verified: true },
    category: MarketplaceCategory.HR,
    tags: ['hr', 'recruitment', 'screening', 'candidates', 'hiring'],
    pricing: { tier: PriceTier.STARTER, price: 49, currency: 'USD' },
    stats: { downloads: 4200, rating: 4.8, reviewCount: 98, activeUsers: 1900, lastUpdated: '2025-01-09' },
    icon: '👤',
    integrations: ['LinkedIn', 'Greenhouse', 'Lever', 'Indeed'],
    steps: 8,
    agents: ['larry', 'mary'],
    estimatedTimeSaved: '20 hours/week',
    successRate: 89,
    featured: true,
    isNew: false,
    isPremium: true,
    createdAt: '2024-10-15',
    updatedAt: '2025-01-09',
    version: '1.3.0',
  },
  {
    id: 'mp-gcc-compliance',
    name: 'GCC Compliance Checker',
    description: 'Ensure your workflows comply with GCC regional regulations including UAE, Saudi Arabia, and Qatar requirements.',
    shortDescription: 'Regional compliance automation',
    author: { id: 'partner-2', name: 'GCC Solutions', type: 'partner', verified: true },
    category: MarketplaceCategory.GCC,
    tags: ['gcc', 'compliance', 'uae', 'saudi', 'regulations', 'mena'],
    pricing: { tier: PriceTier.PRO, price: 99, currency: 'USD' },
    stats: { downloads: 2100, rating: 4.9, reviewCount: 67, activeUsers: 980, lastUpdated: '2025-01-11' },
    icon: '🌍',
    integrations: ['Custom APIs', 'Document Systems'],
    steps: 5,
    agents: ['sam', 'olivia'],
    estimatedTimeSaved: '6 hours/week',
    successRate: 98,
    featured: true,
    isNew: true,
    isPremium: true,
    createdAt: '2024-12-20',
    updatedAt: '2025-01-11',
    version: '1.1.0',
  },
  {
    id: 'mp-customer-onboarding',
    name: 'Customer Onboarding Flow',
    description: 'Automated onboarding sequences with personalized welcome emails, setup guides, and progress tracking.',
    shortDescription: 'Seamless customer setup',
    author: { id: 'nexus', name: 'Nexus Team', type: 'nexus', verified: true },
    category: MarketplaceCategory.CUSTOMER_SUCCESS,
    tags: ['onboarding', 'customer', 'success', 'automation', 'welcome'],
    pricing: { tier: PriceTier.FREE, price: 0, currency: 'USD' },
    stats: { downloads: 9800, rating: 4.7, reviewCount: 234, activeUsers: 5100, lastUpdated: '2025-01-07' },
    icon: '🚀',
    integrations: ['Intercom', 'Slack', 'Gmail', 'Notion'],
    steps: 8,
    agents: ['larry', 'emma', 'sam'],
    estimatedTimeSaved: '12 hours/week',
    successRate: 95,
    featured: false,
    isNew: false,
    isPremium: false,
    createdAt: '2024-07-22',
    updatedAt: '2025-01-07',
    version: '2.0.0',
  },
  {
    id: 'mp-ecommerce-inventory',
    name: 'Smart Inventory Manager',
    description: 'Automatically sync inventory across channels, predict restocking needs, and manage supplier orders.',
    shortDescription: 'Multi-channel inventory sync',
    author: { id: 'partner-3', name: 'ShopOps', type: 'partner', verified: true },
    category: MarketplaceCategory.ECOMMERCE,
    tags: ['ecommerce', 'inventory', 'shopify', 'woocommerce', 'stock'],
    pricing: { tier: PriceTier.STARTER, price: 39, currency: 'USD' },
    stats: { downloads: 6400, rating: 4.6, reviewCount: 156, activeUsers: 3200, lastUpdated: '2025-01-06' },
    icon: '📦',
    integrations: ['Shopify', 'WooCommerce', 'Amazon', 'ShipStation'],
    steps: 6,
    agents: ['alex', 'sam'],
    estimatedTimeSaved: '18 hours/week',
    successRate: 94,
    featured: false,
    isNew: false,
    isPremium: true,
    createdAt: '2024-08-05',
    updatedAt: '2025-01-06',
    version: '1.6.0',
  },
  {
    id: 'mp-legal-doc-review',
    name: 'Legal Document Analyzer',
    description: 'AI-powered contract review, clause extraction, and risk assessment for legal documents.',
    shortDescription: 'Smart contract analysis',
    author: { id: 'partner-4', name: 'LegalTech Pro', type: 'partner', verified: true },
    category: MarketplaceCategory.LEGAL,
    tags: ['legal', 'contracts', 'review', 'ai', 'compliance'],
    pricing: { tier: PriceTier.ENTERPRISE, price: 199, currency: 'USD' },
    stats: { downloads: 1850, rating: 4.8, reviewCount: 45, activeUsers: 890, lastUpdated: '2025-01-10' },
    icon: '⚖️',
    integrations: ['DocuSign', 'Google Drive', 'Dropbox'],
    steps: 5,
    agents: ['larry', 'olivia'],
    estimatedTimeSaved: '25 hours/week',
    successRate: 91,
    featured: true,
    isNew: false,
    isPremium: true,
    createdAt: '2024-09-28',
    updatedAt: '2025-01-10',
    version: '1.2.0',
  },
  {
    id: 'mp-it-ticket-router',
    name: 'IT Support Ticket Router',
    description: 'Automatically categorize, prioritize, and route IT support tickets to the right team members.',
    shortDescription: 'Smart ticket management',
    author: { id: 'community-2', name: 'DevOps Hub', type: 'community' },
    category: MarketplaceCategory.IT,
    tags: ['it', 'support', 'tickets', 'helpdesk', 'automation'],
    pricing: { tier: PriceTier.FREE, price: 0, currency: 'USD' },
    stats: { downloads: 7200, rating: 4.5, reviewCount: 189, activeUsers: 3800, lastUpdated: '2025-01-04' },
    icon: '🎫',
    integrations: ['Jira', 'ServiceNow', 'Zendesk', 'Slack'],
    steps: 4,
    agents: ['sam', 'nexus'],
    estimatedTimeSaved: '8 hours/week',
    successRate: 93,
    featured: false,
    isNew: false,
    isPremium: false,
    createdAt: '2024-06-30',
    updatedAt: '2025-01-04',
    version: '1.9.0',
  },
]

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

/**
 * Calculate text search relevance score
 */
function calculateRelevanceScore(template: MarketplaceTemplate, query: string): number {
  const lowerQuery = query.toLowerCase()
  let score = 0

  // Name match (highest weight)
  if (template.name.toLowerCase().includes(lowerQuery)) {
    score += 100
    if (template.name.toLowerCase().startsWith(lowerQuery)) score += 50
  }

  // Description match
  if (template.description.toLowerCase().includes(lowerQuery)) {
    score += 50
  }

  // Tag match
  const matchingTags = template.tags.filter(tag =>
    tag.toLowerCase().includes(lowerQuery) || lowerQuery.includes(tag.toLowerCase())
  )
  score += matchingTags.length * 30

  // Category match
  if (template.category.toLowerCase().includes(lowerQuery)) {
    score += 40
  }

  // Integration match
  const matchingIntegrations = template.integrations.filter(int =>
    int.toLowerCase().includes(lowerQuery)
  )
  score += matchingIntegrations.length * 20

  return score
}

/**
 * Apply filters to template list
 */
function applyFilters(templates: MarketplaceTemplate[], filters: TemplateFilter): MarketplaceTemplate[] {
  return templates.filter(template => {
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(template.category)) return false
    }

    // Price tier filter
    if (filters.priceTiers && filters.priceTiers.length > 0) {
      if (!filters.priceTiers.includes(template.pricing.tier)) return false
    }

    // Price range filter
    if (filters.priceRange) {
      if (template.pricing.price < filters.priceRange.min) return false
      if (filters.priceRange.max !== null && template.pricing.price > filters.priceRange.max) return false
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      if (template.stats.rating < filters.minRating) return false
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const templateTagsLower = template.tags.map(t => t.toLowerCase())
      const hasMatchingTag = filters.tags.some(filterTag =>
        templateTagsLower.includes(filterTag.toLowerCase())
      )
      if (!hasMatchingTag) return false
    }

    // Integrations filter
    if (filters.integrations && filters.integrations.length > 0) {
      const templateIntsLower = template.integrations.map(i => i.toLowerCase())
      const hasMatchingInt = filters.integrations.some(filterInt =>
        templateIntsLower.includes(filterInt.toLowerCase())
      )
      if (!hasMatchingInt) return false
    }

    // Author type filter
    if (filters.authorTypes && filters.authorTypes.length > 0) {
      if (!filters.authorTypes.includes(template.author.type)) return false
    }

    // Featured filter
    if (filters.featured !== undefined) {
      if (template.featured !== filters.featured) return false
    }

    // New filter
    if (filters.isNew !== undefined) {
      if (template.isNew !== filters.isNew) return false
    }

    // Premium filter
    if (filters.isPremium !== undefined) {
      if (template.isPremium !== filters.isPremium) return false
    }

    return true
  })
}

/**
 * Sort templates by specified criteria
 */
function sortTemplates(templates: MarketplaceTemplate[], sortBy: TemplateSortType): MarketplaceTemplate[] {
  const sorted = [...templates]

  switch (sortBy) {
    case TemplateSort.POPULAR:
      return sorted.sort((a, b) => b.stats.downloads - a.stats.downloads)

    case TemplateSort.RECENT:
      return sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    case TemplateSort.RATING:
      return sorted.sort((a, b) => b.stats.rating - a.stats.rating)

    case TemplateSort.DOWNLOADS:
      return sorted.sort((a, b) => b.stats.downloads - a.stats.downloads)

    case TemplateSort.PRICE_LOW:
      return sorted.sort((a, b) => a.pricing.price - b.pricing.price)

    case TemplateSort.PRICE_HIGH:
      return sorted.sort((a, b) => b.pricing.price - a.pricing.price)

    case TemplateSort.ALPHABETICAL:
      return sorted.sort((a, b) => a.name.localeCompare(b.name))

    default:
      return sorted
  }
}

/**
 * Paginate results
 */
function paginateResults(
  templates: MarketplaceTemplate[],
  page: number,
  pageSize: number
): { items: MarketplaceTemplate[]; pagination: PaginationInfo } {
  const totalItems = templates.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (page - 1) * pageSize
  const items = templates.slice(startIndex, startIndex + pageSize)

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Search templates with text query and filters
 */
export async function searchTemplates(params: SearchParams = {}): Promise<SearchResult> {
  const startTime = performance.now()
  const {
    query,
    filters = {},
    sortBy = TemplateSort.POPULAR,
    page = 1,
    pageSize = 12,
  } = params

  // Create cache key
  const cacheKey = `search:${JSON.stringify(params)}`
  const cached = templateCache.getCached<SearchResult>(cacheKey)
  if (cached) {
    return cached
  }

  // Start with all templates (in real app, this would be an API call)
  let results = [...MOCK_TEMPLATES]

  // Apply text search if query provided
  if (query && query.trim()) {
    const scoredResults = results.map(template => ({
      template,
      score: calculateRelevanceScore(template, query.trim()),
    }))

    // Filter out zero-score results and sort by relevance
    results = scoredResults
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.template)
  }

  // Apply additional filters
  results = applyFilters(results, { ...filters, searchQuery: query })

  // Sort (only if not already sorted by relevance from search)
  if (!query || !query.trim()) {
    results = sortTemplates(results, sortBy)
  }

  // Paginate
  const { items, pagination } = paginateResults(results, page, pageSize)

  const searchResult: SearchResult = {
    templates: items,
    pagination,
    filters,
    sortBy,
    searchTime: performance.now() - startTime,
  }

  // Cache results
  templateCache.setCached(cacheKey, searchResult, 60 * 1000) // 1 minute TTL

  return searchResult
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(
  category: MarketplaceCategoryType,
  params: Omit<SearchParams, 'filters'> = {}
): Promise<SearchResult> {
  return searchTemplates({
    ...params,
    filters: { categories: [category] },
  })
}

/**
 * Get popular templates (most downloaded)
 */
export async function getPopularTemplates(
  limit: number = 10,
  filters?: TemplateFilter
): Promise<MarketplaceTemplate[]> {
  const cacheKey = `popular:${limit}:${JSON.stringify(filters || {})}`
  const cached = templateCache.getCached<MarketplaceTemplate[]>(cacheKey)
  if (cached) {
    return cached
  }

  let results = [...MOCK_TEMPLATES]

  if (filters) {
    results = applyFilters(results, filters)
  }

  const popular = sortTemplates(results, TemplateSort.POPULAR).slice(0, limit)

  templateCache.setCached(cacheKey, popular, 5 * 60 * 1000) // 5 minutes TTL

  return popular
}

/**
 * Get recently added templates
 */
export async function getRecentTemplates(
  limit: number = 10,
  filters?: TemplateFilter
): Promise<MarketplaceTemplate[]> {
  const cacheKey = `recent:${limit}:${JSON.stringify(filters || {})}`
  const cached = templateCache.getCached<MarketplaceTemplate[]>(cacheKey)
  if (cached) {
    return cached
  }

  let results = [...MOCK_TEMPLATES]

  if (filters) {
    results = applyFilters(results, filters)
  }

  const recent = sortTemplates(results, TemplateSort.RECENT).slice(0, limit)

  templateCache.setCached(cacheKey, recent, 5 * 60 * 1000) // 5 minutes TTL

  return recent
}

/**
 * Get featured templates
 */
export async function getFeaturedTemplates(limit: number = 6): Promise<MarketplaceTemplate[]> {
  const cacheKey = `featured:${limit}`
  const cached = templateCache.getCached<MarketplaceTemplate[]>(cacheKey)
  if (cached) {
    return cached
  }

  const featured = MOCK_TEMPLATES
    .filter(t => t.featured)
    .slice(0, limit)

  templateCache.setCached(cacheKey, featured, 10 * 60 * 1000) // 10 minutes TTL

  return featured
}

/**
 * Get suggested templates based on user context
 */
export async function getSuggestedTemplates(
  userContext: {
    persona?: string
    connectedIntegrations?: string[]
    recentCategories?: MarketplaceCategoryType[]
    usageHistory?: string[]
  },
  limit: number = 6
): Promise<MarketplaceTemplate[]> {
  const cacheKey = `suggested:${JSON.stringify(userContext)}:${limit}`
  const cached = templateCache.getCached<MarketplaceTemplate[]>(cacheKey)
  if (cached) {
    return cached
  }

  let results = [...MOCK_TEMPLATES]

  // Score templates based on user context
  const scoredResults = results.map(template => {
    let score = template.stats.rating * 10 // Base score from rating

    // Boost if user has connected integrations that match
    if (userContext.connectedIntegrations) {
      const matchingInts = template.integrations.filter(int =>
        userContext.connectedIntegrations?.some(ci =>
          ci.toLowerCase() === int.toLowerCase()
        )
      )
      score += matchingInts.length * 20
    }

    // Boost if category matches recent activity
    if (userContext.recentCategories?.includes(template.category)) {
      score += 15
    }

    // Penalize if already used
    if (userContext.usageHistory?.includes(template.id)) {
      score -= 30
    }

    // Boost featured templates
    if (template.featured) {
      score += 10
    }

    // Boost new templates slightly
    if (template.isNew) {
      score += 5
    }

    return { template, score }
  })

  const suggested = scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.template)

  templateCache.setCached(cacheKey, suggested, 2 * 60 * 1000) // 2 minutes TTL

  return suggested
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(id: string): Promise<MarketplaceTemplate | null> {
  const cacheKey = `template:${id}`
  const cached = templateCache.getCached<MarketplaceTemplate | null>(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  const template = MOCK_TEMPLATES.find(t => t.id === id) || null

  templateCache.setCached(cacheKey, template, 10 * 60 * 1000) // 10 minutes TTL

  return template
}

/**
 * Get all available tags from templates
 */
export async function getAllTags(): Promise<string[]> {
  const cacheKey = 'all-tags'
  const cached = templateCache.getCached<string[]>(cacheKey)
  if (cached) {
    return cached
  }

  const tagsSet = new Set<string>()
  MOCK_TEMPLATES.forEach(t => t.tags.forEach(tag => tagsSet.add(tag)))

  const tags = Array.from(tagsSet).sort()

  templateCache.setCached(cacheKey, tags, 30 * 60 * 1000) // 30 minutes TTL

  return tags
}

/**
 * Get all available integrations from templates
 */
export async function getAllIntegrations(): Promise<string[]> {
  const cacheKey = 'all-integrations'
  const cached = templateCache.getCached<string[]>(cacheKey)
  if (cached) {
    return cached
  }

  const integrationsSet = new Set<string>()
  MOCK_TEMPLATES.forEach(t => t.integrations.forEach(int => integrationsSet.add(int)))

  const integrations = Array.from(integrationsSet).sort()

  templateCache.setCached(cacheKey, integrations, 30 * 60 * 1000) // 30 minutes TTL

  return integrations
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  MOCK_TEMPLATES as mockTemplates, // Export for testing
}

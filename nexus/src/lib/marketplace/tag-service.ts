/**
 * Tag Service
 *
 * Manages template tags including search, normalization, and suggestions.
 */

import type { Tag, TagSuggestion, CategoryId } from './types'
import { CATEGORY_IDS } from './types'

// =============================================================================
// TAG DATA
// =============================================================================

/**
 * Pre-defined popular tags with metadata
 */
const PREDEFINED_TAGS: Tag[] = [
  // Integration tags
  { id: 'slack', name: 'Slack', slug: 'slack', usageCount: 1250, category: CATEGORY_IDS.OPERATIONS },
  { id: 'gmail', name: 'Gmail', slug: 'gmail', usageCount: 1100, category: CATEGORY_IDS.MARKETING },
  { id: 'salesforce', name: 'Salesforce', slug: 'salesforce', usageCount: 980, category: CATEGORY_IDS.SALES },
  { id: 'hubspot', name: 'HubSpot', slug: 'hubspot', usageCount: 850, category: CATEGORY_IDS.SALES },
  { id: 'zoom', name: 'Zoom', slug: 'zoom', usageCount: 720, category: CATEGORY_IDS.MEETINGS },
  { id: 'teams', name: 'Teams', slug: 'teams', usageCount: 680, category: CATEGORY_IDS.MEETINGS },
  { id: 'notion', name: 'Notion', slug: 'notion', usageCount: 620, category: CATEGORY_IDS.OPERATIONS },
  { id: 'github', name: 'GitHub', slug: 'github', usageCount: 580, category: CATEGORY_IDS.DEVELOPMENT },
  { id: 'jira', name: 'Jira', slug: 'jira', usageCount: 540, category: CATEGORY_IDS.DEVELOPMENT },
  { id: 'google-sheets', name: 'Google Sheets', slug: 'google-sheets', usageCount: 890, category: CATEGORY_IDS.OPERATIONS },
  { id: 'linkedin', name: 'LinkedIn', slug: 'linkedin', usageCount: 560, category: CATEGORY_IDS.HR },
  { id: 'zendesk', name: 'Zendesk', slug: 'zendesk', usageCount: 420, category: CATEGORY_IDS.CUSTOMER },
  { id: 'intercom', name: 'Intercom', slug: 'intercom', usageCount: 380, category: CATEGORY_IDS.CUSTOMER },
  { id: 'quickbooks', name: 'QuickBooks', slug: 'quickbooks', usageCount: 340, category: CATEGORY_IDS.FINANCE },
  { id: 'stripe', name: 'Stripe', slug: 'stripe', usageCount: 460, category: CATEGORY_IDS.FINANCE },
  { id: 'whatsapp', name: 'WhatsApp', slug: 'whatsapp', usageCount: 520, category: CATEGORY_IDS.CUSTOMER },

  // Feature tags
  { id: 'ai-powered', name: 'AI Powered', slug: 'ai-powered', usageCount: 1500 },
  { id: 'automation', name: 'Automation', slug: 'automation', usageCount: 2000 },
  { id: 'no-code', name: 'No-Code', slug: 'no-code', usageCount: 800 },
  { id: 'real-time', name: 'Real-Time', slug: 'real-time', usageCount: 650 },
  { id: 'scheduled', name: 'Scheduled', slug: 'scheduled', usageCount: 720 },
  { id: 'webhook', name: 'Webhook', slug: 'webhook', usageCount: 480, category: CATEGORY_IDS.DEVELOPMENT },
  { id: 'api', name: 'API', slug: 'api', usageCount: 560, category: CATEGORY_IDS.DEVELOPMENT },

  // Use case tags
  { id: 'lead-generation', name: 'Lead Generation', slug: 'lead-generation', usageCount: 780, category: CATEGORY_IDS.SALES },
  { id: 'email-marketing', name: 'Email Marketing', slug: 'email-marketing', usageCount: 920, category: CATEGORY_IDS.MARKETING },
  { id: 'social-media', name: 'Social Media', slug: 'social-media', usageCount: 680, category: CATEGORY_IDS.MARKETING },
  { id: 'customer-support', name: 'Customer Support', slug: 'customer-support', usageCount: 590, category: CATEGORY_IDS.CUSTOMER },
  { id: 'data-sync', name: 'Data Sync', slug: 'data-sync', usageCount: 520, category: CATEGORY_IDS.OPERATIONS },
  { id: 'notifications', name: 'Notifications', slug: 'notifications', usageCount: 780 },
  { id: 'reporting', name: 'Reporting', slug: 'reporting', usageCount: 650, category: CATEGORY_IDS.OPERATIONS },
  { id: 'analytics', name: 'Analytics', slug: 'analytics', usageCount: 580, category: CATEGORY_IDS.OPERATIONS },
  { id: 'crm', name: 'CRM', slug: 'crm', usageCount: 720, category: CATEGORY_IDS.SALES },
  { id: 'onboarding', name: 'Onboarding', slug: 'onboarding', usageCount: 440, category: CATEGORY_IDS.HR },
  { id: 'recruiting', name: 'Recruiting', slug: 'recruiting', usageCount: 380, category: CATEGORY_IDS.HR },
  { id: 'invoicing', name: 'Invoicing', slug: 'invoicing', usageCount: 320, category: CATEGORY_IDS.FINANCE },
  { id: 'expense-tracking', name: 'Expense Tracking', slug: 'expense-tracking', usageCount: 290, category: CATEGORY_IDS.FINANCE },
  { id: 'meeting-notes', name: 'Meeting Notes', slug: 'meeting-notes', usageCount: 480, category: CATEGORY_IDS.MEETINGS },
  { id: 'document-processing', name: 'Document Processing', slug: 'document-processing', usageCount: 420, category: CATEGORY_IDS.OPERATIONS },
  { id: 'content-creation', name: 'Content Creation', slug: 'content-creation', usageCount: 560, category: CATEGORY_IDS.MARKETING },
]

/**
 * Tag relationship map for related tag suggestions
 */
const TAG_RELATIONSHIPS: Record<string, string[]> = {
  'slack': ['notifications', 'teams', 'real-time', 'automation'],
  'gmail': ['email-marketing', 'notifications', 'automation'],
  'salesforce': ['crm', 'lead-generation', 'hubspot', 'sales'],
  'hubspot': ['crm', 'salesforce', 'email-marketing', 'lead-generation'],
  'zoom': ['meeting-notes', 'teams', 'scheduled', 'calendar'],
  'ai-powered': ['automation', 'no-code', 'content-creation'],
  'lead-generation': ['crm', 'salesforce', 'hubspot', 'email-marketing'],
  'email-marketing': ['gmail', 'mailchimp', 'lead-generation', 'automation'],
  'customer-support': ['zendesk', 'intercom', 'whatsapp', 'notifications'],
  'automation': ['ai-powered', 'scheduled', 'webhook', 'no-code'],
  'reporting': ['analytics', 'google-sheets', 'data-sync'],
}

// =============================================================================
// LOCAL STORAGE
// =============================================================================

const CUSTOM_TAGS_KEY = 'nexus_custom_tags'
const TAG_SEARCH_HISTORY_KEY = 'nexus_tag_search_history'

function getCustomTags(): Tag[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TAGS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCustomTag(tag: Tag): void {
  const customTags = getCustomTags()
  const existingIndex = customTags.findIndex((t) => t.slug === tag.slug)

  if (existingIndex >= 0) {
    customTags[existingIndex].usageCount++
  } else {
    customTags.push(tag)
  }

  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(customTags))
}

function getTagSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(TAG_SEARCH_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addTagSearchHistory(query: string): void {
  const history = getTagSearchHistory()
  const normalizedQuery = query.toLowerCase().trim()

  // Remove if exists and add to front
  const filtered = history.filter((q) => q !== normalizedQuery)
  filtered.unshift(normalizedQuery)

  // Keep only last 20 searches
  localStorage.setItem(TAG_SEARCH_HISTORY_KEY, JSON.stringify(filtered.slice(0, 20)))
}

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Normalize a tag string to consistent format
 */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Create a Tag object from a string
 */
export function createTag(name: string, category?: CategoryId): Tag {
  const slug = normalizeTag(name)
  return {
    id: slug,
    name: name.trim(),
    slug,
    usageCount: 1,
    category,
  }
}

/**
 * Get all available tags (predefined + custom)
 */
export function getAllTags(): Tag[] {
  const customTags = getCustomTags()

  // Merge custom with predefined, preferring custom usage counts
  const mergedTags = [...PREDEFINED_TAGS]

  for (const customTag of customTags) {
    const existingIndex = mergedTags.findIndex((t) => t.slug === customTag.slug)
    if (existingIndex >= 0) {
      mergedTags[existingIndex].usageCount += customTag.usageCount
    } else {
      mergedTags.push(customTag)
    }
  }

  return mergedTags
}

/**
 * Get popular tags sorted by usage count
 */
export function getPopularTags(limit: number = 20): Tag[] {
  return getAllTags()
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}

/**
 * Get popular tags for a specific category
 */
export function getPopularTagsByCategory(categoryId: CategoryId, limit: number = 10): Tag[] {
  return getAllTags()
    .filter((tag) => tag.category === categoryId)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}

/**
 * Search tags by query with autocomplete
 */
export function searchTags(query: string, limit: number = 10): Tag[] {
  const normalizedQuery = query.toLowerCase().trim()

  if (!normalizedQuery) {
    return getPopularTags(limit)
  }

  // Track search for history
  if (normalizedQuery.length >= 2) {
    addTagSearchHistory(normalizedQuery)
  }

  const allTags = getAllTags()

  // Score tags based on match quality
  const scored = allTags.map((tag) => {
    let score = 0
    const tagName = tag.name.toLowerCase()
    const tagSlug = tag.slug.toLowerCase()

    // Exact match
    if (tagName === normalizedQuery || tagSlug === normalizedQuery) {
      score = 100
    }
    // Starts with query
    else if (tagName.startsWith(normalizedQuery) || tagSlug.startsWith(normalizedQuery)) {
      score = 80
    }
    // Contains query
    else if (tagName.includes(normalizedQuery) || tagSlug.includes(normalizedQuery)) {
      score = 60
    }
    // Words start with query
    else if (
      tagName.split(/[\s-]/).some((word) => word.startsWith(normalizedQuery))
    ) {
      score = 40
    }

    // Boost by popularity
    score += Math.min(tag.usageCount / 100, 20)

    return { tag, score }
  })

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.tag)
}

/**
 * Get related tags based on a given tag
 */
export function getRelatedTags(tagSlug: string, limit: number = 5): TagSuggestion[] {
  const relatedSlugs = TAG_RELATIONSHIPS[tagSlug] || []
  const allTags = getAllTags()

  const suggestions: TagSuggestion[] = []

  // First, add explicitly related tags
  for (const relatedSlug of relatedSlugs) {
    const tag = allTags.find((t) => t.slug === relatedSlug)
    if (tag) {
      suggestions.push({
        tag,
        relevanceScore: 90,
        reason: 'Commonly used together',
      })
    }
  }

  // Then add tags from the same category
  const sourceTag = allTags.find((t) => t.slug === tagSlug)
  if (sourceTag?.category) {
    const categoryTags = allTags
      .filter(
        (t) =>
          t.category === sourceTag.category &&
          t.slug !== tagSlug &&
          !relatedSlugs.includes(t.slug)
      )
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3)

    for (const tag of categoryTags) {
      suggestions.push({
        tag,
        relevanceScore: 70,
        reason: `Same category: ${sourceTag.category}`,
      })
    }
  }

  return suggestions.slice(0, limit)
}

/**
 * Get tag suggestions based on current selection
 */
export function getTagSuggestions(
  selectedTags: string[],
  limit: number = 8
): TagSuggestion[] {
  if (selectedTags.length === 0) {
    return getPopularTags(limit).map((tag) => ({
      tag,
      relevanceScore: tag.usageCount / 20,
      reason: 'Popular tag',
    }))
  }

  const suggestionMap = new Map<string, TagSuggestion>()

  // Get related tags for each selected tag
  for (const selectedSlug of selectedTags) {
    const related = getRelatedTags(selectedSlug, 3)
    for (const suggestion of related) {
      // Don't suggest already selected tags
      if (selectedTags.includes(suggestion.tag.slug)) continue

      const existing = suggestionMap.get(suggestion.tag.slug)
      if (existing) {
        // Boost score if suggested by multiple tags
        existing.relevanceScore = Math.min(
          100,
          existing.relevanceScore + suggestion.relevanceScore * 0.3
        )
      } else {
        suggestionMap.set(suggestion.tag.slug, { ...suggestion })
      }
    }
  }

  return Array.from(suggestionMap.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

/**
 * Get trending tags (recently popular)
 */
export function getTrendingTags(limit: number = 10): Tag[] {
  // In a real implementation, this would query recent usage data
  // For now, return a mix of popular tags with "new" bias
  const allTags = getAllTags()

  return allTags
    .filter((tag) => tag.usageCount > 200)
    .sort((a, b) => {
      // Simulate trending by adding randomness to popular tags
      const aScore = a.usageCount * (0.8 + Math.random() * 0.4)
      const bScore = b.usageCount * (0.8 + Math.random() * 0.4)
      return bScore - aScore
    })
    .slice(0, limit)
}

/**
 * Record tag usage (when user selects a tag)
 */
export function recordTagUsage(tagSlug: string): void {
  const allTags = getAllTags()
  const existingTag = allTags.find((t) => t.slug === tagSlug)

  if (existingTag) {
    saveCustomTag({ ...existingTag, usageCount: 1 })
  }
}

/**
 * Get recent tag searches
 */
export function getRecentTagSearches(limit: number = 5): string[] {
  return getTagSearchHistory().slice(0, limit)
}

/**
 * Validate tag format
 */
export function isValidTag(tag: string): boolean {
  const normalized = normalizeTag(tag)
  return normalized.length >= 2 && normalized.length <= 50
}

/**
 * Get tag by slug
 */
export function getTagBySlug(slug: string): Tag | undefined {
  return getAllTags().find((t) => t.slug === slug)
}

/**
 * Format tag for display
 */
export function formatTagDisplay(tag: Tag): string {
  return tag.name
}

/**
 * Get tags matching specific integrations
 */
export function getIntegrationTags(integrations: string[]): Tag[] {
  const normalizedIntegrations = integrations.map((i) => normalizeTag(i))
  return getAllTags().filter((tag) =>
    normalizedIntegrations.includes(tag.slug)
  )
}

/**
 * Category Service
 *
 * Manages template categories including hierarchy, stats, and visual mapping.
 */

import type {
  Category,
  CategoryId,
  CategoryStats,
} from './types'
import { CATEGORY_IDS } from './types'

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

/**
 * Category icon mapping - centralized icon definitions
 */
export const CATEGORY_ICONS: Record<CategoryId, string> = {
  [CATEGORY_IDS.ALL]: '📦',
  [CATEGORY_IDS.FAVORITES]: '❤️',
  [CATEGORY_IDS.MARKETING]: '📢',
  [CATEGORY_IDS.SALES]: '💼',
  [CATEGORY_IDS.OPERATIONS]: '⚙️',
  [CATEGORY_IDS.HR]: '👥',
  [CATEGORY_IDS.DEVELOPMENT]: '💻',
  [CATEGORY_IDS.FINANCE]: '💰',
  [CATEGORY_IDS.CUSTOMER]: '🎯',
  [CATEGORY_IDS.MEETINGS]: '📝',
  [CATEGORY_IDS.HEALTHCARE]: '🏥',
  [CATEGORY_IDS.LEGAL]: '⚖️',
  [CATEGORY_IDS.EDUCATION]: '📚',
  [CATEGORY_IDS.CUSTOM]: '⭐',
}

/**
 * Category color mapping - Tailwind color names
 */
export const CATEGORY_COLORS: Record<CategoryId, string> = {
  [CATEGORY_IDS.ALL]: 'slate',
  [CATEGORY_IDS.FAVORITES]: 'red',
  [CATEGORY_IDS.MARKETING]: 'pink',
  [CATEGORY_IDS.SALES]: 'blue',
  [CATEGORY_IDS.OPERATIONS]: 'amber',
  [CATEGORY_IDS.HR]: 'cyan',
  [CATEGORY_IDS.DEVELOPMENT]: 'violet',
  [CATEGORY_IDS.FINANCE]: 'emerald',
  [CATEGORY_IDS.CUSTOMER]: 'orange',
  [CATEGORY_IDS.MEETINGS]: 'purple',
  [CATEGORY_IDS.HEALTHCARE]: 'teal',
  [CATEGORY_IDS.LEGAL]: 'indigo',
  [CATEGORY_IDS.EDUCATION]: 'sky',
  [CATEGORY_IDS.CUSTOM]: 'yellow',
}

/**
 * Full category definitions with descriptions
 */
const CATEGORIES: Category[] = [
  {
    id: CATEGORY_IDS.ALL,
    label: 'All Templates',
    icon: CATEGORY_ICONS[CATEGORY_IDS.ALL],
    color: CATEGORY_COLORS[CATEGORY_IDS.ALL],
    description: 'Browse all available templates',
  },
  {
    id: CATEGORY_IDS.FAVORITES,
    label: 'Favorites',
    icon: CATEGORY_ICONS[CATEGORY_IDS.FAVORITES],
    color: CATEGORY_COLORS[CATEGORY_IDS.FAVORITES],
    description: 'Your favorited templates',
  },
  {
    id: CATEGORY_IDS.MARKETING,
    label: 'Marketing',
    icon: CATEGORY_ICONS[CATEGORY_IDS.MARKETING],
    color: CATEGORY_COLORS[CATEGORY_IDS.MARKETING],
    description: 'Marketing automation workflows',
    subcategories: [
      {
        id: 'marketing' as CategoryId,
        label: 'Email Marketing',
        icon: '📧',
        color: 'pink',
        parentId: CATEGORY_IDS.MARKETING,
      },
      {
        id: 'marketing' as CategoryId,
        label: 'Social Media',
        icon: '📱',
        color: 'pink',
        parentId: CATEGORY_IDS.MARKETING,
      },
      {
        id: 'marketing' as CategoryId,
        label: 'Content Creation',
        icon: '✍️',
        color: 'pink',
        parentId: CATEGORY_IDS.MARKETING,
      },
    ],
  },
  {
    id: CATEGORY_IDS.SALES,
    label: 'Sales',
    icon: CATEGORY_ICONS[CATEGORY_IDS.SALES],
    color: CATEGORY_COLORS[CATEGORY_IDS.SALES],
    description: 'Sales automation and CRM workflows',
    subcategories: [
      {
        id: 'sales' as CategoryId,
        label: 'Lead Management',
        icon: '🎯',
        color: 'blue',
        parentId: CATEGORY_IDS.SALES,
      },
      {
        id: 'sales' as CategoryId,
        label: 'Pipeline Automation',
        icon: '📊',
        color: 'blue',
        parentId: CATEGORY_IDS.SALES,
      },
    ],
  },
  {
    id: CATEGORY_IDS.OPERATIONS,
    label: 'Operations',
    icon: CATEGORY_ICONS[CATEGORY_IDS.OPERATIONS],
    color: CATEGORY_COLORS[CATEGORY_IDS.OPERATIONS],
    description: 'Operations and process automation',
  },
  {
    id: CATEGORY_IDS.HR,
    label: 'HR',
    icon: CATEGORY_ICONS[CATEGORY_IDS.HR],
    color: CATEGORY_COLORS[CATEGORY_IDS.HR],
    description: 'Human resources workflows',
    subcategories: [
      {
        id: 'hr' as CategoryId,
        label: 'Recruiting',
        icon: '👤',
        color: 'cyan',
        parentId: CATEGORY_IDS.HR,
      },
      {
        id: 'hr' as CategoryId,
        label: 'Onboarding',
        icon: '🚀',
        color: 'cyan',
        parentId: CATEGORY_IDS.HR,
      },
    ],
  },
  {
    id: CATEGORY_IDS.DEVELOPMENT,
    label: 'Development',
    icon: CATEGORY_ICONS[CATEGORY_IDS.DEVELOPMENT],
    color: CATEGORY_COLORS[CATEGORY_IDS.DEVELOPMENT],
    description: 'Developer tools and automation',
  },
  {
    id: CATEGORY_IDS.FINANCE,
    label: 'Finance',
    icon: CATEGORY_ICONS[CATEGORY_IDS.FINANCE],
    color: CATEGORY_COLORS[CATEGORY_IDS.FINANCE],
    description: 'Financial automation and reporting',
  },
  {
    id: CATEGORY_IDS.CUSTOMER,
    label: 'Customer Success',
    icon: CATEGORY_ICONS[CATEGORY_IDS.CUSTOMER],
    color: CATEGORY_COLORS[CATEGORY_IDS.CUSTOMER],
    description: 'Customer support and success workflows',
  },
  {
    id: CATEGORY_IDS.MEETINGS,
    label: 'Meetings',
    icon: CATEGORY_ICONS[CATEGORY_IDS.MEETINGS],
    color: CATEGORY_COLORS[CATEGORY_IDS.MEETINGS],
    description: 'Meeting management and notes',
  },
  {
    id: CATEGORY_IDS.HEALTHCARE,
    label: 'Healthcare',
    icon: CATEGORY_ICONS[CATEGORY_IDS.HEALTHCARE],
    color: CATEGORY_COLORS[CATEGORY_IDS.HEALTHCARE],
    description: 'Healthcare-specific workflows',
  },
  {
    id: CATEGORY_IDS.LEGAL,
    label: 'Legal',
    icon: CATEGORY_ICONS[CATEGORY_IDS.LEGAL],
    color: CATEGORY_COLORS[CATEGORY_IDS.LEGAL],
    description: 'Legal document and contract automation',
  },
  {
    id: CATEGORY_IDS.EDUCATION,
    label: 'Education',
    icon: CATEGORY_ICONS[CATEGORY_IDS.EDUCATION],
    color: CATEGORY_COLORS[CATEGORY_IDS.EDUCATION],
    description: 'Educational and training workflows',
  },
  {
    id: CATEGORY_IDS.CUSTOM,
    label: 'My Templates',
    icon: CATEGORY_ICONS[CATEGORY_IDS.CUSTOM],
    color: CATEGORY_COLORS[CATEGORY_IDS.CUSTOM],
    description: 'Your custom saved templates',
  },
]

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get all available categories
 */
export function getCategories(): Category[] {
  return CATEGORIES
}

/**
 * Get a single category by ID
 */
export function getCategoryById(categoryId: CategoryId): Category | undefined {
  return CATEGORIES.find((cat) => cat.id === categoryId)
}

/**
 * Get category icon by ID
 */
export function getCategoryIcon(categoryId: CategoryId): string {
  return CATEGORY_ICONS[categoryId] || '📦'
}

/**
 * Get category color by ID
 */
export function getCategoryColor(categoryId: CategoryId): string {
  return CATEGORY_COLORS[categoryId] || 'slate'
}

/**
 * Get category hierarchy (nested structure)
 */
export function getCategoryHierarchy(): Category[] {
  // Return only top-level categories with their subcategories
  return CATEGORIES.filter((cat) => !cat.parentId)
}

/**
 * Get flat list of all categories including subcategories
 */
export function getAllCategoriesFlat(): Category[] {
  const result: Category[] = []

  for (const category of CATEGORIES) {
    result.push(category)
    if (category.subcategories) {
      for (const sub of category.subcategories) {
        result.push(sub)
      }
    }
  }

  return result
}

/**
 * Calculate category statistics from template data
 */
export function getCategoryStats(
  templates: Array<{ category: string; rating?: number; id: string }>
): CategoryStats[] {
  const statsMap = new Map<CategoryId, CategoryStats>()

  // Initialize all categories with zero counts
  for (const category of CATEGORIES) {
    statsMap.set(category.id, {
      categoryId: category.id,
      count: 0,
      popularTemplates: [],
      averageRating: 0,
    })
  }

  // Count templates per category and collect ratings
  const ratingsMap = new Map<CategoryId, number[]>()

  for (const template of templates) {
    const categoryId = template.category as CategoryId
    const stats = statsMap.get(categoryId)

    if (stats) {
      stats.count++
      stats.popularTemplates.push(template.id)

      // Track ratings
      if (template.rating !== undefined) {
        const ratings = ratingsMap.get(categoryId) || []
        ratings.push(template.rating)
        ratingsMap.set(categoryId, ratings)
      }
    }

    // Also count in "all" category
    const allStats = statsMap.get(CATEGORY_IDS.ALL)
    if (allStats) {
      allStats.count++
    }
  }

  // Calculate average ratings
  for (const [categoryId, ratings] of ratingsMap) {
    const stats = statsMap.get(categoryId)
    if (stats && ratings.length > 0) {
      stats.averageRating =
        ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    }
  }

  // Limit popular templates to top 5
  for (const stats of statsMap.values()) {
    stats.popularTemplates = stats.popularTemplates.slice(0, 5)
  }

  return Array.from(statsMap.values())
}

/**
 * Search categories by query
 */
export function searchCategories(query: string): Category[] {
  const normalizedQuery = query.toLowerCase().trim()

  if (!normalizedQuery) {
    return CATEGORIES
  }

  return CATEGORIES.filter(
    (cat) =>
      cat.label.toLowerCase().includes(normalizedQuery) ||
      cat.description?.toLowerCase().includes(normalizedQuery)
  )
}

/**
 * Get suggested categories based on integrations or tags
 */
export function getSuggestedCategories(
  integrations: string[],
  tags: string[]
): Category[] {
  const suggestions: Category[] = []
  const normalizedIntegrations = integrations.map((i) => i.toLowerCase())
  const normalizedTags = tags.map((t) => t.toLowerCase())

  // Map integrations to categories
  const integrationCategoryMap: Record<string, CategoryId[]> = {
    salesforce: [CATEGORY_IDS.SALES, CATEGORY_IDS.CUSTOMER],
    hubspot: [CATEGORY_IDS.SALES, CATEGORY_IDS.MARKETING],
    gmail: [CATEGORY_IDS.MARKETING, CATEGORY_IDS.SALES],
    slack: [CATEGORY_IDS.OPERATIONS, CATEGORY_IDS.MEETINGS],
    zoom: [CATEGORY_IDS.MEETINGS],
    teams: [CATEGORY_IDS.MEETINGS],
    github: [CATEGORY_IDS.DEVELOPMENT],
    jira: [CATEGORY_IDS.DEVELOPMENT, CATEGORY_IDS.OPERATIONS],
    quickbooks: [CATEGORY_IDS.FINANCE],
    xero: [CATEGORY_IDS.FINANCE],
    linkedin: [CATEGORY_IDS.HR, CATEGORY_IDS.MARKETING],
    zendesk: [CATEGORY_IDS.CUSTOMER],
    intercom: [CATEGORY_IDS.CUSTOMER],
  }

  const suggestedCategoryIds = new Set<CategoryId>()

  for (const integration of normalizedIntegrations) {
    const categoryIds = integrationCategoryMap[integration]
    if (categoryIds) {
      for (const id of categoryIds) {
        suggestedCategoryIds.add(id)
      }
    }
  }

  // Map tags to categories
  const tagCategoryMap: Record<string, CategoryId[]> = {
    crm: [CATEGORY_IDS.SALES],
    lead: [CATEGORY_IDS.SALES],
    email: [CATEGORY_IDS.MARKETING],
    social: [CATEGORY_IDS.MARKETING],
    hr: [CATEGORY_IDS.HR],
    hiring: [CATEGORY_IDS.HR],
    finance: [CATEGORY_IDS.FINANCE],
    invoice: [CATEGORY_IDS.FINANCE],
    support: [CATEGORY_IDS.CUSTOMER],
    meeting: [CATEGORY_IDS.MEETINGS],
    code: [CATEGORY_IDS.DEVELOPMENT],
    healthcare: [CATEGORY_IDS.HEALTHCARE],
    legal: [CATEGORY_IDS.LEGAL],
  }

  for (const tag of normalizedTags) {
    for (const [keyword, categoryIds] of Object.entries(tagCategoryMap)) {
      if (tag.includes(keyword)) {
        for (const id of categoryIds) {
          suggestedCategoryIds.add(id)
        }
      }
    }
  }

  for (const categoryId of suggestedCategoryIds) {
    const category = getCategoryById(categoryId)
    if (category) {
      suggestions.push(category)
    }
  }

  return suggestions.slice(0, 5)
}

/**
 * Get Tailwind background color class for category
 */
export function getCategoryBgClass(categoryId: CategoryId): string {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-500/10',
    red: 'bg-red-500/10',
    pink: 'bg-pink-500/10',
    blue: 'bg-blue-500/10',
    amber: 'bg-amber-500/10',
    cyan: 'bg-cyan-500/10',
    violet: 'bg-violet-500/10',
    emerald: 'bg-emerald-500/10',
    orange: 'bg-orange-500/10',
    purple: 'bg-purple-500/10',
    teal: 'bg-teal-500/10',
    indigo: 'bg-indigo-500/10',
    sky: 'bg-sky-500/10',
    yellow: 'bg-yellow-500/10',
  }

  const color = CATEGORY_COLORS[categoryId]
  return colorMap[color] || 'bg-slate-500/10'
}

/**
 * Get Tailwind text color class for category
 */
export function getCategoryTextClass(categoryId: CategoryId): string {
  const colorMap: Record<string, string> = {
    slate: 'text-slate-500',
    red: 'text-red-500',
    pink: 'text-pink-500',
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    cyan: 'text-cyan-500',
    violet: 'text-violet-500',
    emerald: 'text-emerald-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500',
    teal: 'text-teal-500',
    indigo: 'text-indigo-500',
    sky: 'text-sky-500',
    yellow: 'text-yellow-500',
  }

  const color = CATEGORY_COLORS[categoryId]
  return colorMap[color] || 'text-slate-500'
}

/**
 * Get Tailwind border color class for category
 */
export function getCategoryBorderClass(categoryId: CategoryId): string {
  const colorMap: Record<string, string> = {
    slate: 'border-slate-500',
    red: 'border-red-500',
    pink: 'border-pink-500',
    blue: 'border-blue-500',
    amber: 'border-amber-500',
    cyan: 'border-cyan-500',
    violet: 'border-violet-500',
    emerald: 'border-emerald-500',
    orange: 'border-orange-500',
    purple: 'border-purple-500',
    teal: 'border-teal-500',
    indigo: 'border-indigo-500',
    sky: 'border-sky-500',
    yellow: 'border-yellow-500',
  }

  const color = CATEGORY_COLORS[categoryId]
  return colorMap[color] || 'border-slate-500'
}

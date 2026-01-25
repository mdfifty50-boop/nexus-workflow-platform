/**
 * Integration Catalog
 *
 * Comprehensive catalog of available integrations with metadata,
 * categorization, and industry-specific recommendations.
 *
 * TypeScript Guidelines:
 * - Uses const objects with type aliases (no enums)
 * - All types properly exported for reuse
 */

// ============================================================================
// Category Definitions (using const object pattern, NOT enums)
// ============================================================================

export const INTEGRATION_CATEGORIES = {
  COMMUNICATION: 'communication',
  CRM: 'crm',
  ECOMMERCE: 'ecommerce',
  PRODUCTIVITY: 'productivity',
  MARKETING: 'marketing',
  PAYMENT: 'payment',
} as const

export type IntegrationCategory = typeof INTEGRATION_CATEGORIES[keyof typeof INTEGRATION_CATEGORIES]

// ============================================================================
// Industry Definitions
// ============================================================================

export const INDUSTRIES = {
  ECOMMERCE: 'ecommerce',
  PROFESSIONAL_SERVICES: 'professional-services',
  SAAS: 'saas',
  REAL_ESTATE: 'real-estate',
  MARKETING_AGENCY: 'marketing-agency',
  OTHER: 'other',
} as const

export type Industry = typeof INDUSTRIES[keyof typeof INDUSTRIES]

// ============================================================================
// Business Size Definitions
// ============================================================================

export const BUSINESS_SIZES = {
  SOLO: 'solo',
  SMALL: 'small',
  MEDIUM: 'medium',
  ENTERPRISE: 'enterprise',
} as const

export type BusinessSize = typeof BUSINESS_SIZES[keyof typeof BUSINESS_SIZES]

// ============================================================================
// Integration Type Definitions
// ============================================================================

export interface Integration {
  id: string
  name: string
  description: string
  category: IntegrationCategory
  iconName: string
  iconBgGradient: string
  isPopular: boolean
  features: string[]
  /** Industries where this integration is particularly useful */
  recommendedForIndustries: Industry[]
  /** Business sizes where this integration is recommended */
  recommendedForSizes: BusinessSize[]
}

export interface IntegrationBundle {
  id: string
  name: string
  description: string
  integrationIds: string[]
  forIndustries: Industry[]
}

// ============================================================================
// Category Metadata
// ============================================================================

export interface CategoryInfo {
  id: IntegrationCategory
  label: string
  iconName: string
  description: string
}

export const CATEGORY_INFO: CategoryInfo[] = [
  {
    id: INTEGRATION_CATEGORIES.COMMUNICATION,
    label: 'Communication',
    iconName: 'MessageSquare',
    description: 'Email, chat, and messaging apps',
  },
  {
    id: INTEGRATION_CATEGORIES.CRM,
    label: 'CRM',
    iconName: 'Users',
    description: 'Customer relationship management',
  },
  {
    id: INTEGRATION_CATEGORIES.ECOMMERCE,
    label: 'E-commerce',
    iconName: 'ShoppingBag',
    description: 'Online stores and marketplaces',
  },
  {
    id: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    label: 'Productivity',
    iconName: 'Layers',
    description: 'Docs, spreadsheets, and tools',
  },
  {
    id: INTEGRATION_CATEGORIES.MARKETING,
    label: 'Marketing',
    iconName: 'Megaphone',
    description: 'Email marketing and campaigns',
  },
  {
    id: INTEGRATION_CATEGORIES.PAYMENT,
    label: 'Payments',
    iconName: 'CreditCard',
    description: 'Payment processing and billing',
  },
]

// ============================================================================
// Integration Catalog
// ============================================================================

export const INTEGRATIONS: Integration[] = [
  // Communication
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and receive emails automatically',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    iconName: 'Mail',
    iconBgGradient: 'from-red-500 to-red-600',
    isPopular: true,
    features: ['Send emails', 'Read emails', 'Labels & filters', 'Attachments'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE, INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.SAAS, INDUSTRIES.REAL_ESTATE, INDUSTRIES.MARKETING_AGENCY, INDUSTRIES.OTHER],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Microsoft email and calendar integration',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    iconName: 'Mail',
    iconBgGradient: 'from-blue-600 to-blue-700',
    isPopular: true,
    features: ['Email automation', 'Calendar sync', 'Contacts', 'Tasks'],
    recommendedForIndustries: [INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.SAAS, INDUSTRIES.OTHER],
    recommendedForSizes: [BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional and marketing emails at scale',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    iconName: 'Send',
    iconBgGradient: 'from-blue-500 to-cyan-500',
    isPopular: false,
    features: ['Bulk emails', 'Templates', 'Analytics', 'Deliverability'],
    recommendedForIndustries: [INDUSTRIES.SAAS, INDUSTRIES.MARKETING_AGENCY],
    recommendedForSizes: [BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team messaging and notifications',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    iconName: 'MessageSquare',
    iconBgGradient: 'from-purple-500 to-purple-600',
    isPopular: true,
    features: ['Messages', 'Channels', 'Threads', 'File sharing'],
    recommendedForIndustries: [INDUSTRIES.SAAS, INDUSTRIES.MARKETING_AGENCY, INDUSTRIES.ECOMMERCE],
    recommendedForSizes: [BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Community messaging and voice',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    iconName: 'MessageCircle',
    iconBgGradient: 'from-indigo-500 to-purple-500',
    isPopular: false,
    features: ['Messages', 'Channels', 'Webhooks', 'Bots'],
    recommendedForIndustries: [INDUSTRIES.SAAS, INDUSTRIES.OTHER],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Enterprise communication and collaboration',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    iconName: 'Users',
    iconBgGradient: 'from-purple-600 to-indigo-600',
    isPopular: true,
    features: ['Messages', 'Meetings', 'Channels', 'Files'],
    recommendedForIndustries: [INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.SAAS],
    recommendedForSizes: [BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },

  // CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM platform',
    category: INTEGRATION_CATEGORIES.CRM,
    iconName: 'Cloud',
    iconBgGradient: 'from-blue-500 to-cyan-400',
    isPopular: true,
    features: ['Leads', 'Opportunities', 'Contacts', 'Reports'],
    recommendedForIndustries: [INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.SAAS],
    recommendedForSizes: [BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing, sales, and service CRM',
    category: INTEGRATION_CATEGORIES.CRM,
    iconName: 'Heart',
    iconBgGradient: 'from-orange-500 to-red-500',
    isPopular: true,
    features: ['Contacts', 'Deals', 'Marketing', 'Analytics'],
    recommendedForIndustries: [INDUSTRIES.MARKETING_AGENCY, INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.SAAS],
    recommendedForSizes: [BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM],
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales-focused CRM for small teams',
    category: INTEGRATION_CATEGORIES.CRM,
    iconName: 'Target',
    iconBgGradient: 'from-green-500 to-emerald-500',
    isPopular: false,
    features: ['Pipeline', 'Deals', 'Activities', 'Reports'],
    recommendedForIndustries: [INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.REAL_ESTATE],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL],
  },

  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Leading e-commerce platform',
    category: INTEGRATION_CATEGORIES.ECOMMERCE,
    iconName: 'ShoppingBag',
    iconBgGradient: 'from-green-500 to-lime-400',
    isPopular: true,
    features: ['Orders', 'Products', 'Customers', 'Inventory'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress e-commerce solution',
    category: INTEGRATION_CATEGORIES.ECOMMERCE,
    iconName: 'ShoppingCart',
    iconBgGradient: 'from-purple-600 to-indigo-500',
    isPopular: true,
    features: ['Orders', 'Products', 'Customers', 'Coupons'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL],
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    description: 'Scalable e-commerce platform',
    category: INTEGRATION_CATEGORIES.ECOMMERCE,
    iconName: 'Store',
    iconBgGradient: 'from-slate-700 to-slate-900',
    isPopular: false,
    features: ['Orders', 'Products', 'Multi-channel', 'B2B'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE],
    recommendedForSizes: [BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },

  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Online payment processing',
    category: INTEGRATION_CATEGORIES.PAYMENT,
    iconName: 'CreditCard',
    iconBgGradient: 'from-indigo-500 to-purple-600',
    isPopular: true,
    features: ['Payments', 'Subscriptions', 'Invoices', 'Payouts'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE, INDUSTRIES.SAAS, INDUSTRIES.PROFESSIONAL_SERVICES],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Global payment solution',
    category: INTEGRATION_CATEGORIES.PAYMENT,
    iconName: 'DollarSign',
    iconBgGradient: 'from-blue-600 to-blue-800',
    isPopular: true,
    features: ['Payments', 'Invoices', 'Subscriptions', 'Checkout'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL],
  },
  {
    id: 'square',
    name: 'Square',
    description: 'In-person and online payments',
    category: INTEGRATION_CATEGORIES.PAYMENT,
    iconName: 'Square',
    iconBgGradient: 'from-slate-800 to-black',
    isPopular: false,
    features: ['POS', 'Invoices', 'Online', 'Inventory'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE, INDUSTRIES.PROFESSIONAL_SERVICES],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL],
  },

  // Productivity
  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes and docs',
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    iconName: 'FileText',
    iconBgGradient: 'from-slate-600 to-slate-800',
    isPopular: true,
    features: ['Pages', 'Databases', 'Tasks', 'Wiki'],
    recommendedForIndustries: [INDUSTRIES.SAAS, INDUSTRIES.MARKETING_AGENCY, INDUSTRIES.PROFESSIONAL_SERVICES],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Flexible database and spreadsheet hybrid',
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    iconName: 'Table',
    iconBgGradient: 'from-yellow-500 to-orange-500',
    isPopular: true,
    features: ['Bases', 'Views', 'Automations', 'Apps'],
    recommendedForIndustries: [INDUSTRIES.MARKETING_AGENCY, INDUSTRIES.PROFESSIONAL_SERVICES],
    recommendedForSizes: [BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM],
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Cloud spreadsheets with collaboration',
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    iconName: 'Grid3X3',
    iconBgGradient: 'from-green-500 to-green-600',
    isPopular: true,
    features: ['Read/Write', 'Formulas', 'Charts', 'Sharing'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE, INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.SAAS, INDUSTRIES.REAL_ESTATE, INDUSTRIES.MARKETING_AGENCY, INDUSTRIES.OTHER],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM, BUSINESS_SIZES.ENTERPRISE],
  },

  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and automation',
    category: INTEGRATION_CATEGORIES.MARKETING,
    iconName: 'Mail',
    iconBgGradient: 'from-yellow-400 to-yellow-600',
    isPopular: true,
    features: ['Campaigns', 'Audiences', 'Automations', 'Analytics'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE, INDUSTRIES.MARKETING_AGENCY],
    recommendedForSizes: [BUSINESS_SIZES.SOLO, BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM],
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'E-commerce email and SMS marketing',
    category: INTEGRATION_CATEGORIES.MARKETING,
    iconName: 'Zap',
    iconBgGradient: 'from-green-600 to-teal-600',
    isPopular: false,
    features: ['Email flows', 'SMS', 'Segmentation', 'Analytics'],
    recommendedForIndustries: [INDUSTRIES.ECOMMERCE],
    recommendedForSizes: [BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM],
  },
  {
    id: 'activecampaign',
    name: 'ActiveCampaign',
    description: 'Marketing automation and CRM',
    category: INTEGRATION_CATEGORIES.MARKETING,
    iconName: 'Rocket',
    iconBgGradient: 'from-blue-500 to-blue-700',
    isPopular: false,
    features: ['Automations', 'Email', 'CRM', 'Messaging'],
    recommendedForIndustries: [INDUSTRIES.MARKETING_AGENCY, INDUSTRIES.PROFESSIONAL_SERVICES],
    recommendedForSizes: [BUSINESS_SIZES.SMALL, BUSINESS_SIZES.MEDIUM],
  },
]

// ============================================================================
// Integration Bundles ("Works great together")
// ============================================================================

export const INTEGRATION_BUNDLES: IntegrationBundle[] = [
  {
    id: 'ecommerce-starter',
    name: 'E-commerce Starter',
    description: 'Essential apps for online stores',
    integrationIds: ['shopify', 'gmail', 'slack', 'stripe'],
    forIndustries: [INDUSTRIES.ECOMMERCE],
  },
  {
    id: 'sales-stack',
    name: 'Sales Power Stack',
    description: 'Close more deals faster',
    integrationIds: ['hubspot', 'gmail', 'slack', 'google-sheets'],
    forIndustries: [INDUSTRIES.PROFESSIONAL_SERVICES, INDUSTRIES.SAAS],
  },
  {
    id: 'marketing-toolkit',
    name: 'Marketing Toolkit',
    description: 'Full-funnel marketing automation',
    integrationIds: ['mailchimp', 'gmail', 'airtable', 'slack'],
    forIndustries: [INDUSTRIES.MARKETING_AGENCY],
  },
  {
    id: 'saas-essentials',
    name: 'SaaS Essentials',
    description: 'Core tools for software companies',
    integrationIds: ['stripe', 'slack', 'notion', 'gmail'],
    forIndustries: [INDUSTRIES.SAAS],
  },
  {
    id: 'real-estate-pro',
    name: 'Real Estate Pro',
    description: 'Manage leads and close deals',
    integrationIds: ['gmail', 'google-sheets', 'pipedrive'],
    forIndustries: [INDUSTRIES.REAL_ESTATE],
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get integrations filtered by category
 */
export function getIntegrationsByCategory(category: IntegrationCategory): Integration[] {
  return INTEGRATIONS.filter((integration) => integration.category === category)
}

/**
 * Get integrations recommended for a specific industry
 */
export function getRecommendedForIndustry(industry: Industry): Integration[] {
  return INTEGRATIONS.filter((integration) =>
    integration.recommendedForIndustries.includes(industry)
  ).sort((a, b) => {
    // Sort popular integrations first
    if (a.isPopular && !b.isPopular) return -1
    if (!a.isPopular && b.isPopular) return 1
    return 0
  })
}

/**
 * Get popular integrations across all categories
 */
export function getPopularIntegrations(): Integration[] {
  return INTEGRATIONS.filter((integration) => integration.isPopular)
}

/**
 * Get integration bundles for a specific industry
 */
export function getBundlesForIndustry(industry: Industry): IntegrationBundle[] {
  return INTEGRATION_BUNDLES.filter((bundle) =>
    bundle.forIndustries.includes(industry)
  )
}

/**
 * Get integration by ID
 */
export function getIntegrationById(id: string): Integration | undefined {
  return INTEGRATIONS.find((integration) => integration.id === id)
}

/**
 * Get integrations by IDs
 */
export function getIntegrationsByIds(ids: string[]): Integration[] {
  return ids
    .map((id) => getIntegrationById(id))
    .filter((integration): integration is Integration => integration !== undefined)
}

/**
 * Search integrations by name or description
 */
export function searchIntegrations(query: string): Integration[] {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return INTEGRATIONS

  return INTEGRATIONS.filter(
    (integration) =>
      integration.name.toLowerCase().includes(normalizedQuery) ||
      integration.description.toLowerCase().includes(normalizedQuery) ||
      integration.features.some((feature) =>
        feature.toLowerCase().includes(normalizedQuery)
      )
  )
}

/**
 * Map industry from BusinessTypeSelector to catalog Industry type
 */
export function mapBusinessTypeToIndustry(businessTypeId: string): Industry {
  const mapping: Record<string, Industry> = {
    'ecommerce': INDUSTRIES.ECOMMERCE,
    'professional-services': INDUSTRIES.PROFESSIONAL_SERVICES,
    'saas': INDUSTRIES.SAAS,
    'real-estate': INDUSTRIES.REAL_ESTATE,
    'marketing-agency': INDUSTRIES.MARKETING_AGENCY,
    'other': INDUSTRIES.OTHER,
  }
  return mapping[businessTypeId] || INDUSTRIES.OTHER
}

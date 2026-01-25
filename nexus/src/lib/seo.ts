/**
 * SEO Utilities for Nexus
 * Centralized SEO configuration with defaults and helpers
 */

// =============================================================================
// SITE CONFIGURATION
// =============================================================================

export const SITE_CONFIG = {
  name: 'Nexus',
  tagline: 'AI Workflow Automation',
  description: 'Nexus - AI-powered workflow automation platform. Describe any task in plain English and our AI agents build it instantly. Connect 8,500+ apps with intelligent automation.',
  url: 'https://nexus.app', // Update with actual production URL
  domain: 'nexus.app',
  logo: '/icons/icon-512x512.png',
  ogImage: '/og-image.png', // Default social share image
  twitterHandle: '@nexusapp',
  themeColor: '#3b82f6',
  locale: 'en_US',
} as const

// =============================================================================
// DEFAULT META VALUES
// =============================================================================

export const DEFAULT_META = {
  title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  keywords: [
    'workflow automation',
    'AI automation',
    'no-code automation',
    'business automation',
    'AI agents',
    'task automation',
    'process automation',
    'integration platform',
    'Zapier alternative',
    'n8n alternative',
    'Make alternative',
  ].join(', '),
  author: SITE_CONFIG.name,
  robots: 'index, follow',
} as const

// =============================================================================
// PAGE-SPECIFIC SEO CONFIGURATIONS
// =============================================================================

export interface PageSEO {
  title: string
  description: string
  keywords?: string
  ogImage?: string
  noIndex?: boolean
  canonical?: string
  type?: 'website' | 'article' | 'product'
}

export const PAGE_SEO: Record<string, PageSEO> = {
  home: {
    title: 'Nexus - AI-Powered Workflow Automation | Build Automations in Seconds',
    description: 'Transform your business with AI-powered workflow automation. Describe tasks in plain English and watch Nexus build them instantly. Connect 8,500+ apps. Start free.',
    keywords: 'AI workflow automation, no-code automation, business process automation, AI agents, task automation, Zapier alternative',
    type: 'website',
  },
  try: {
    title: 'Try Nexus Free | Build AI Workflows Instantly',
    description: 'See the magic in seconds. Describe any workflow in plain English and watch Nexus AI build it instantly. No account required to try.',
    keywords: 'try workflow automation, free automation tool, AI workflow builder, instant automation',
    type: 'website',
  },
  templates: {
    title: 'Workflow Templates | Pre-Built Automations | Nexus',
    description: 'Browse 100+ pre-built workflow templates. Email automation, sales reports, customer feedback analysis, and more. Start automating in minutes.',
    keywords: 'workflow templates, automation templates, pre-built workflows, email automation, sales automation',
    type: 'website',
  },
  dashboard: {
    title: 'Dashboard | Nexus',
    description: 'Your Nexus workflow automation dashboard. Monitor active workflows, track performance, and manage AI agents.',
    noIndex: true, // User-specific content
  },
  login: {
    title: 'Log In | Nexus',
    description: 'Log in to your Nexus account to manage your AI-powered workflow automations.',
    noIndex: true,
  },
  signup: {
    title: 'Sign Up Free | Nexus',
    description: 'Create your free Nexus account and start building AI-powered workflow automations. No credit card required.',
    keywords: 'sign up, create account, free automation account',
  },
  workflows: {
    title: 'My Workflows | Nexus',
    description: 'View and manage your workflow automations in Nexus.',
    noIndex: true,
  },
  integrations: {
    title: 'Integrations | Connect 8,500+ Apps | Nexus',
    description: 'Connect Nexus to 8,500+ apps and services. Gmail, Slack, Salesforce, Google Sheets, and more. Seamless integrations for powerful automation.',
    keywords: 'integrations, app connections, API integrations, Gmail integration, Slack integration, Salesforce integration',
  },
  settings: {
    title: 'Settings | Nexus',
    description: 'Manage your Nexus account settings and preferences.',
    noIndex: true,
  },
  profile: {
    title: 'Profile | Nexus',
    description: 'View your Nexus profile, achievements, and automation statistics.',
    noIndex: true,
  },
  privacy: {
    title: 'Privacy Policy | Nexus',
    description: 'Nexus privacy policy. Learn how we protect your data and respect your privacy.',
  },
  terms: {
    title: 'Terms of Service | Nexus',
    description: 'Nexus terms of service. Read our terms and conditions for using the platform.',
  },
  help: {
    title: 'Help Center | Nexus',
    description: 'Get help with Nexus. FAQs, tutorials, and support resources for workflow automation.',
    keywords: 'help, support, FAQ, tutorials, documentation',
  },
}

// =============================================================================
// TITLE GENERATOR
// =============================================================================

/**
 * Generate a page title with consistent formatting
 * @param pageTitle - The specific page title
 * @param includeSiteName - Whether to append site name (default: true)
 */
export function generateTitle(pageTitle?: string, includeSiteName = true): string {
  if (!pageTitle) {
    return DEFAULT_META.title
  }

  if (includeSiteName && !pageTitle.toLowerCase().includes(SITE_CONFIG.name.toLowerCase())) {
    return `${pageTitle} | ${SITE_CONFIG.name}`
  }

  return pageTitle
}

/**
 * Generate full URL for a path
 */
export function getFullUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_CONFIG.url}${cleanPath}`
}

/**
 * Get SEO config for a page by key
 */
export function getPageSEO(pageKey: string): PageSEO {
  return PAGE_SEO[pageKey] || {
    title: DEFAULT_META.title,
    description: DEFAULT_META.description,
  }
}

// =============================================================================
// STRUCTURED DATA GENERATORS
// =============================================================================

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: getFullUrl(SITE_CONFIG.logo),
    description: SITE_CONFIG.description,
    sameAs: [
      `https://twitter.com/${SITE_CONFIG.twitterHandle.replace('@', '')}`,
      // Add other social profiles as needed
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English'],
    },
  }
}

/**
 * Generate SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: SITE_CONFIG.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2500',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'AI-powered workflow building',
      'Natural language automation',
      '8,500+ app integrations',
      'Visual workflow editor',
      'Real-time execution monitoring',
      'Team collaboration',
    ],
  }
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getFullUrl(item.url),
    })),
  }
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(page: {
  title: string
  description: string
  url: string
  datePublished?: string
  dateModified?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: getFullUrl(page.url),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    ...(page.datePublished && { datePublished: page.datePublished }),
    ...(page.dateModified && { dateModified: page.dateModified }),
  }
}

// =============================================================================
// LANDING PAGE FAQs
// =============================================================================

export const LANDING_PAGE_FAQS = [
  {
    question: 'What is Nexus?',
    answer: 'Nexus is an AI-powered workflow automation platform that lets you describe tasks in plain English and instantly builds automations for you. Connect 8,500+ apps and services with intelligent AI agents.',
  },
  {
    question: 'How does AI workflow building work?',
    answer: 'Simply describe what you want to automate in natural language. Our AI understands your request, identifies the necessary integrations, and builds a complete workflow in seconds. No coding or technical knowledge required.',
  },
  {
    question: 'Is Nexus free to use?',
    answer: 'Yes! Nexus offers a generous free tier that includes core automation features. Premium plans are available for teams and businesses that need advanced features, more integrations, and higher execution limits.',
  },
  {
    question: 'What apps can I connect with Nexus?',
    answer: 'Nexus connects with over 8,500 apps and services including Gmail, Slack, Google Sheets, Salesforce, HubSpot, Notion, Trello, and many more. New integrations are added regularly.',
  },
  {
    question: 'How is Nexus different from Zapier or Make?',
    answer: 'Unlike traditional automation tools, Nexus uses AI to understand and build workflows from natural language descriptions. You describe what you want in plain English, and our AI agents handle the technical implementation.',
  },
  {
    question: 'Is my data secure with Nexus?',
    answer: 'Absolutely. Nexus uses enterprise-grade security with encrypted data transmission, secure authentication, and compliance with industry standards. We never store your sensitive data longer than necessary.',
  },
]

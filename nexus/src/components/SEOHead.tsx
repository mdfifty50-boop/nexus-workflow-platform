/**
 * SEOHead Component
 * Dynamic meta tag management for React pages using react-helmet-async
 */

import { Helmet } from 'react-helmet-async'
import {
  SITE_CONFIG,
  DEFAULT_META,
  generateTitle,
  getFullUrl,
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateWebPageSchema,
} from '@/lib/seo'

// =============================================================================
// TYPES
// =============================================================================

export interface SEOHeadProps {
  /** Page title (will be formatted with site name) */
  title?: string
  /** Meta description */
  description?: string
  /** Meta keywords */
  keywords?: string
  /** Canonical URL path (e.g., '/templates') */
  canonical?: string
  /** OpenGraph image URL */
  ogImage?: string
  /** OpenGraph type */
  ogType?: 'website' | 'article' | 'product'
  /** Prevent indexing */
  noIndex?: boolean
  /** Additional structured data (JSON-LD) */
  structuredData?: object | object[]
  /** Include Organization schema */
  includeOrganization?: boolean
  /** Include SoftwareApplication schema */
  includeSoftwareApp?: boolean
  /** FAQ items for FAQ schema */
  faqs?: Array<{ question: string; answer: string }>
  /** Breadcrumb items */
  breadcrumbs?: Array<{ name: string; url: string }>
  /** Article metadata (for blog posts) */
  article?: {
    publishedTime?: string
    modifiedTime?: string
    author?: string
    section?: string
    tags?: string[]
  }
  /** Children for additional head elements */
  children?: React.ReactNode
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SEOHead({
  title,
  description = DEFAULT_META.description,
  keywords = DEFAULT_META.keywords,
  canonical,
  ogImage = SITE_CONFIG.ogImage,
  ogType = 'website',
  noIndex = false,
  structuredData,
  includeOrganization = false,
  includeSoftwareApp = false,
  faqs,
  breadcrumbs,
  article,
  children,
}: SEOHeadProps) {
  const pageTitle = generateTitle(title)
  const fullCanonical = canonical ? getFullUrl(canonical) : undefined
  const fullOgImage = ogImage?.startsWith('http') ? ogImage : getFullUrl(ogImage)

  // Collect all structured data
  const allStructuredData: object[] = []

  if (includeOrganization) {
    allStructuredData.push(generateOrganizationSchema())
  }

  if (includeSoftwareApp) {
    allStructuredData.push(generateSoftwareApplicationSchema())
  }

  if (faqs && faqs.length > 0) {
    allStructuredData.push(generateFAQSchema(faqs))
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    allStructuredData.push(generateBreadcrumbSchema(breadcrumbs))
  }

  if (canonical) {
    allStructuredData.push(
      generateWebPageSchema({
        title: pageTitle,
        description,
        url: canonical,
      })
    )
  }

  if (structuredData) {
    if (Array.isArray(structuredData)) {
      allStructuredData.push(...structuredData)
    } else {
      allStructuredData.push(structuredData)
    }
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={DEFAULT_META.author} />

      {/* Robots */}
      <meta
        name="robots"
        content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
      />
      <meta
        name="googlebot"
        content={noIndex ? 'noindex, nofollow' : 'index, follow'}
      />

      {/* Canonical */}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:alt" content={`${SITE_CONFIG.name} - ${description.substring(0, 100)}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      <meta property="og:locale" content={SITE_CONFIG.locale} />

      {/* Article-specific OG tags */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && <meta property="article:author" content={article.author} />}
      {article?.section && <meta property="article:section" content={article.section} />}
      {article?.tags?.map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
      <meta name="twitter:creator" content={SITE_CONFIG.twitterHandle} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:image:alt" content={`${SITE_CONFIG.name} - ${description.substring(0, 100)}`} />

      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* Additional children */}
      {children}
    </Helmet>
  )
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * SEO configuration for the landing/home page
 */
export function LandingPageSEO() {
  const faqs = [
    {
      question: 'What is Nexus?',
      answer: 'Nexus is an AI-powered workflow automation platform that lets you describe tasks in plain English and instantly builds automations for you. Connect 800+ apps and services with intelligent AI agents.',
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
      answer: 'Nexus connects with over 800 apps and services including Gmail, Slack, Google Sheets, Salesforce, HubSpot, Notion, Trello, and many more. New integrations are added regularly.',
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

  return (
    <SEOHead
      title="AI-Powered Workflow Automation | Build Automations in Seconds"
      description="Transform your business with AI-powered workflow automation. Describe tasks in plain English and watch Nexus build them instantly. Connect 800+ apps. Start free."
      keywords="AI workflow automation, no-code automation, business process automation, AI agents, task automation, Zapier alternative, Make alternative, n8n alternative"
      canonical="/"
      ogType="website"
      includeOrganization
      includeSoftwareApp
      faqs={faqs}
      breadcrumbs={[{ name: 'Home', url: '/' }]}
    />
  )
}

/**
 * SEO configuration for the Try page
 */
export function TryPageSEO() {
  return (
    <SEOHead
      title="Try Nexus Free | Build AI Workflows Instantly"
      description="See the magic in seconds. Describe any workflow in plain English and watch Nexus AI build it instantly. No account required to try."
      keywords="try workflow automation, free automation tool, AI workflow builder, instant automation, demo automation"
      canonical="/try"
      ogType="website"
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Try Free', url: '/try' },
      ]}
    />
  )
}

/**
 * SEO configuration for Templates page
 */
export function TemplatesPageSEO() {
  return (
    <SEOHead
      title="Workflow Templates | Pre-Built Automations"
      description="Browse 100+ pre-built workflow templates. Email automation, sales reports, customer feedback analysis, and more. Start automating in minutes."
      keywords="workflow templates, automation templates, pre-built workflows, email automation templates, sales automation, marketing automation"
      canonical="/templates"
      ogType="website"
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Templates', url: '/templates' },
      ]}
    />
  )
}

/**
 * SEO configuration for Dashboard (noindex)
 */
export function DashboardPageSEO() {
  return (
    <SEOHead
      title="Dashboard"
      description="Your Nexus workflow automation dashboard. Monitor active workflows, track performance, and manage AI agents."
      noIndex
    />
  )
}

/**
 * SEO configuration for Integrations page
 */
export function IntegrationsPageSEO() {
  return (
    <SEOHead
      title="Integrations | Connect 800+ Apps"
      description="Connect Nexus to 800+ apps and services. Gmail, Slack, Salesforce, Google Sheets, and more. Seamless integrations for powerful automation."
      keywords="integrations, app connections, API integrations, Gmail integration, Slack integration, Salesforce integration, Google Sheets integration"
      canonical="/integrations"
      ogType="website"
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Integrations', url: '/integrations' },
      ]}
    />
  )
}

/**
 * SEO configuration for authenticated pages (generic noindex)
 */
export function AuthenticatedPageSEO({ title }: { title: string }) {
  return (
    <SEOHead
      title={title}
      description={`${title} - Manage your Nexus workflow automations.`}
      noIndex
    />
  )
}

export default SEOHead

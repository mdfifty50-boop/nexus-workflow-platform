/**
 * Business Profile Types
 *
 * Type definitions for the business profile collection step
 * in the onboarding flow. Uses const objects with type aliases
 * instead of enums per TypeScript requirements.
 */

// ============================================================================
// COMPANY SIZE
// ============================================================================

export const COMPANY_SIZES = {
  solo: 'solo',
  small: '2-10',
  medium: '11-50',
  large: '51-200',
  enterprise: '200+',
} as const

export type CompanySize = (typeof COMPANY_SIZES)[keyof typeof COMPANY_SIZES]

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  [COMPANY_SIZES.solo]: 'Solo (Just me)',
  [COMPANY_SIZES.small]: 'Small (2-10 employees)',
  [COMPANY_SIZES.medium]: 'Medium (11-50 employees)',
  [COMPANY_SIZES.large]: 'Large (51-200 employees)',
  [COMPANY_SIZES.enterprise]: 'Enterprise (200+ employees)',
}

// ============================================================================
// PRIMARY ROLE
// ============================================================================

export const PRIMARY_ROLES = {
  founder: 'founder',
  executive: 'executive',
  manager: 'manager',
  developer: 'developer',
  marketer: 'marketer',
  sales: 'sales',
  operations: 'operations',
  support: 'support',
  other: 'other',
} as const

export type PrimaryRole = (typeof PRIMARY_ROLES)[keyof typeof PRIMARY_ROLES]

export const PRIMARY_ROLE_LABELS: Record<PrimaryRole, string> = {
  [PRIMARY_ROLES.founder]: 'Founder / CEO',
  [PRIMARY_ROLES.executive]: 'Executive / C-Level',
  [PRIMARY_ROLES.manager]: 'Manager / Team Lead',
  [PRIMARY_ROLES.developer]: 'Developer / Engineer',
  [PRIMARY_ROLES.marketer]: 'Marketer',
  [PRIMARY_ROLES.sales]: 'Sales',
  [PRIMARY_ROLES.operations]: 'Operations',
  [PRIMARY_ROLES.support]: 'Support / Customer Success',
  [PRIMARY_ROLES.other]: 'Other',
}

// ============================================================================
// INDUSTRY
// ============================================================================

export const INDUSTRIES = {
  ecommerce: 'ecommerce',
  saas: 'saas',
  agency: 'agency',
  consulting: 'consulting',
  healthcare: 'healthcare',
  finance: 'finance',
  education: 'education',
  realestate: 'realestate',
  manufacturing: 'manufacturing',
  retail: 'retail',
  nonprofit: 'nonprofit',
  other: 'other',
} as const

export type Industry = (typeof INDUSTRIES)[keyof typeof INDUSTRIES]

export const INDUSTRY_LABELS: Record<Industry, string> = {
  [INDUSTRIES.ecommerce]: 'E-commerce / Online Retail',
  [INDUSTRIES.saas]: 'SaaS / Technology',
  [INDUSTRIES.agency]: 'Agency / Creative Services',
  [INDUSTRIES.consulting]: 'Consulting / Professional Services',
  [INDUSTRIES.healthcare]: 'Healthcare',
  [INDUSTRIES.finance]: 'Finance / Banking',
  [INDUSTRIES.education]: 'Education',
  [INDUSTRIES.realestate]: 'Real Estate',
  [INDUSTRIES.manufacturing]: 'Manufacturing',
  [INDUSTRIES.retail]: 'Retail / Brick & Mortar',
  [INDUSTRIES.nonprofit]: 'Non-profit',
  [INDUSTRIES.other]: 'Other',
}

// ============================================================================
// AUTOMATION PRIORITIES
// ============================================================================

export const AUTOMATION_PRIORITIES = {
  email: 'email',
  crm: 'crm',
  social: 'social',
  reporting: 'reporting',
  invoicing: 'invoicing',
  scheduling: 'scheduling',
  dataEntry: 'data-entry',
  customerSupport: 'customer-support',
  leadGen: 'lead-gen',
  inventory: 'inventory',
  marketing: 'marketing',
  hr: 'hr',
} as const

export type AutomationPriority = (typeof AUTOMATION_PRIORITIES)[keyof typeof AUTOMATION_PRIORITIES]

export const AUTOMATION_PRIORITY_LABELS: Record<AutomationPriority, string> = {
  [AUTOMATION_PRIORITIES.email]: 'Email Management',
  [AUTOMATION_PRIORITIES.crm]: 'CRM & Contact Management',
  [AUTOMATION_PRIORITIES.social]: 'Social Media',
  [AUTOMATION_PRIORITIES.reporting]: 'Reporting & Analytics',
  [AUTOMATION_PRIORITIES.invoicing]: 'Invoicing & Payments',
  [AUTOMATION_PRIORITIES.scheduling]: 'Scheduling & Calendar',
  [AUTOMATION_PRIORITIES.dataEntry]: 'Data Entry',
  [AUTOMATION_PRIORITIES.customerSupport]: 'Customer Support',
  [AUTOMATION_PRIORITIES.leadGen]: 'Lead Generation',
  [AUTOMATION_PRIORITIES.inventory]: 'Inventory Management',
  [AUTOMATION_PRIORITIES.marketing]: 'Marketing Campaigns',
  [AUTOMATION_PRIORITIES.hr]: 'HR & Recruiting',
}

// ============================================================================
// PAIN POINTS
// ============================================================================

export const PAIN_POINTS = {
  timeConsuming: 'time-consuming',
  errorProne: 'error-prone',
  scattered: 'scattered-tools',
  noVisibility: 'no-visibility',
  scaling: 'scaling-issues',
  repetitive: 'repetitive-tasks',
  communication: 'poor-communication',
  delays: 'process-delays',
} as const

export type PainPoint = (typeof PAIN_POINTS)[keyof typeof PAIN_POINTS]

export const PAIN_POINT_LABELS: Record<PainPoint, string> = {
  [PAIN_POINTS.timeConsuming]: 'Tasks take too long',
  [PAIN_POINTS.errorProne]: 'Too many manual errors',
  [PAIN_POINTS.scattered]: 'Data scattered across tools',
  [PAIN_POINTS.noVisibility]: 'No visibility into processes',
  [PAIN_POINTS.scaling]: 'Hard to scale operations',
  [PAIN_POINTS.repetitive]: 'Too many repetitive tasks',
  [PAIN_POINTS.communication]: 'Poor team communication',
  [PAIN_POINTS.delays]: 'Process delays & bottlenecks',
}

// ============================================================================
// TIME SAVINGS GOALS
// ============================================================================

export const TIME_SAVINGS_GOALS = {
  hours5: '5',
  hours10: '10',
  hours20: '20',
  hours40: '40',
} as const

export type TimeSavingsGoal = (typeof TIME_SAVINGS_GOALS)[keyof typeof TIME_SAVINGS_GOALS]

export const TIME_SAVINGS_LABELS: Record<TimeSavingsGoal, string> = {
  [TIME_SAVINGS_GOALS.hours5]: '5+ hours/week',
  [TIME_SAVINGS_GOALS.hours10]: '10+ hours/week',
  [TIME_SAVINGS_GOALS.hours20]: '20+ hours/week',
  [TIME_SAVINGS_GOALS.hours40]: '40+ hours/week',
}

// ============================================================================
// BUDGET RANGE
// ============================================================================

export const BUDGET_RANGES = {
  free: 'free',
  starter: 'starter',
  professional: 'professional',
  enterprise: 'enterprise',
} as const

export type BudgetRange = (typeof BUDGET_RANGES)[keyof typeof BUDGET_RANGES]

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  [BUDGET_RANGES.free]: 'Free tier only',
  [BUDGET_RANGES.starter]: '$0 - $79/month',
  [BUDGET_RANGES.professional]: '$79 - $249/month',
  [BUDGET_RANGES.enterprise]: '$249+/month',
}

// ============================================================================
// E-COMMERCE SPECIFIC FIELDS
// ============================================================================

export const ECOMMERCE_PLATFORMS = {
  shopify: 'shopify',
  woocommerce: 'woocommerce',
  magento: 'magento',
  bigcommerce: 'bigcommerce',
  squarespace: 'squarespace',
  wix: 'wix',
  amazon: 'amazon',
  etsy: 'etsy',
  other: 'other',
} as const

export type EcommercePlatform = (typeof ECOMMERCE_PLATFORMS)[keyof typeof ECOMMERCE_PLATFORMS]

export const ECOMMERCE_PLATFORM_LABELS: Record<EcommercePlatform, string> = {
  [ECOMMERCE_PLATFORMS.shopify]: 'Shopify',
  [ECOMMERCE_PLATFORMS.woocommerce]: 'WooCommerce',
  [ECOMMERCE_PLATFORMS.magento]: 'Magento / Adobe Commerce',
  [ECOMMERCE_PLATFORMS.bigcommerce]: 'BigCommerce',
  [ECOMMERCE_PLATFORMS.squarespace]: 'Squarespace',
  [ECOMMERCE_PLATFORMS.wix]: 'Wix',
  [ECOMMERCE_PLATFORMS.amazon]: 'Amazon Seller',
  [ECOMMERCE_PLATFORMS.etsy]: 'Etsy',
  [ECOMMERCE_PLATFORMS.other]: 'Other',
}

export const ORDER_VOLUMES = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  very_high: 'very-high',
} as const

export type OrderVolume = (typeof ORDER_VOLUMES)[keyof typeof ORDER_VOLUMES]

export const ORDER_VOLUME_LABELS: Record<OrderVolume, string> = {
  [ORDER_VOLUMES.low]: 'Less than 100/month',
  [ORDER_VOLUMES.medium]: '100 - 1,000/month',
  [ORDER_VOLUMES.high]: '1,000 - 10,000/month',
  [ORDER_VOLUMES.very_high]: '10,000+/month',
}

// ============================================================================
// SAAS SPECIFIC FIELDS
// ============================================================================

export const USER_BASE_SIZES = {
  prelaunch: 'prelaunch',
  early: 'early',
  growing: 'growing',
  established: 'established',
  enterprise: 'enterprise',
} as const

export type UserBaseSize = (typeof USER_BASE_SIZES)[keyof typeof USER_BASE_SIZES]

export const USER_BASE_SIZE_LABELS: Record<UserBaseSize, string> = {
  [USER_BASE_SIZES.prelaunch]: 'Pre-launch',
  [USER_BASE_SIZES.early]: '1 - 100 users',
  [USER_BASE_SIZES.growing]: '100 - 1,000 users',
  [USER_BASE_SIZES.established]: '1,000 - 10,000 users',
  [USER_BASE_SIZES.enterprise]: '10,000+ users',
}

export const TECH_STACKS = {
  javascript: 'javascript',
  python: 'python',
  ruby: 'ruby',
  java: 'java',
  dotnet: 'dotnet',
  php: 'php',
  go: 'go',
  nocode: 'nocode',
  other: 'other',
} as const

export type TechStack = (typeof TECH_STACKS)[keyof typeof TECH_STACKS]

export const TECH_STACK_LABELS: Record<TechStack, string> = {
  [TECH_STACKS.javascript]: 'JavaScript / TypeScript',
  [TECH_STACKS.python]: 'Python',
  [TECH_STACKS.ruby]: 'Ruby',
  [TECH_STACKS.java]: 'Java / Kotlin',
  [TECH_STACKS.dotnet]: '.NET / C#',
  [TECH_STACKS.php]: 'PHP',
  [TECH_STACKS.go]: 'Go',
  [TECH_STACKS.nocode]: 'No-code / Low-code',
  [TECH_STACKS.other]: 'Other',
}

// ============================================================================
// AGENCY SPECIFIC FIELDS
// ============================================================================

export const CLIENT_COUNTS = {
  few: 'few',
  some: 'some',
  many: 'many',
  lots: 'lots',
} as const

export type ClientCount = (typeof CLIENT_COUNTS)[keyof typeof CLIENT_COUNTS]

export const CLIENT_COUNT_LABELS: Record<ClientCount, string> = {
  [CLIENT_COUNTS.few]: '1 - 5 clients',
  [CLIENT_COUNTS.some]: '6 - 20 clients',
  [CLIENT_COUNTS.many]: '21 - 50 clients',
  [CLIENT_COUNTS.lots]: '50+ clients',
}

export const SERVICE_TYPES = {
  marketing: 'marketing',
  design: 'design',
  development: 'development',
  consulting: 'consulting',
  seo: 'seo',
  content: 'content',
  social: 'social',
  ppc: 'ppc',
  fullService: 'full-service',
  other: 'other',
} as const

export type ServiceType = (typeof SERVICE_TYPES)[keyof typeof SERVICE_TYPES]

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [SERVICE_TYPES.marketing]: 'Marketing Strategy',
  [SERVICE_TYPES.design]: 'Design / Creative',
  [SERVICE_TYPES.development]: 'Web / App Development',
  [SERVICE_TYPES.consulting]: 'Business Consulting',
  [SERVICE_TYPES.seo]: 'SEO',
  [SERVICE_TYPES.content]: 'Content Creation',
  [SERVICE_TYPES.social]: 'Social Media Management',
  [SERVICE_TYPES.ppc]: 'PPC / Paid Advertising',
  [SERVICE_TYPES.fullService]: 'Full Service Agency',
  [SERVICE_TYPES.other]: 'Other',
}

// ============================================================================
// BUSINESS PROFILE STATE
// ============================================================================

export interface EcommerceFields {
  platform: EcommercePlatform | null
  orderVolume: OrderVolume | null
}

export interface SaasFields {
  userBaseSize: UserBaseSize | null
  techStack: TechStack[]
}

export interface AgencyFields {
  clientCount: ClientCount | null
  serviceTypes: ServiceType[]
}

export interface BusinessProfileData {
  // Basic info
  businessName: string
  industry: Industry | null
  companySize: CompanySize | null
  primaryRole: PrimaryRole | null
  timezone: string

  // Industry-specific
  ecommerceFields: EcommerceFields
  saasFields: SaasFields
  agencyFields: AgencyFields
  customIndustryDescription: string

  // Goals & priorities
  automationPriorities: AutomationPriority[]
  painPoints: PainPoint[]
  timeSavingsGoal: TimeSavingsGoal | null
  budgetRange: BudgetRange | null
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfileData = {
  businessName: '',
  industry: null,
  companySize: null,
  primaryRole: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  ecommerceFields: {
    platform: null,
    orderVolume: null,
  },
  saasFields: {
    userBaseSize: null,
    techStack: [],
  },
  agencyFields: {
    clientCount: null,
    serviceTypes: [],
  },
  customIndustryDescription: '',

  automationPriorities: [],
  painPoints: [],
  timeSavingsGoal: null,
  budgetRange: null,
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationErrors {
  businessName?: string
  industry?: string
  companySize?: string
  primaryRole?: string
  automationPriorities?: string
}

export function validateBusinessProfile(data: BusinessProfileData): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!data.businessName.trim()) {
    errors.businessName = 'Business name is required'
  } else if (data.businessName.length < 2) {
    errors.businessName = 'Business name must be at least 2 characters'
  }

  if (!data.industry) {
    errors.industry = 'Please select an industry'
  }

  if (!data.companySize) {
    errors.companySize = 'Please select company size'
  }

  if (!data.primaryRole) {
    errors.primaryRole = 'Please select your role'
  }

  if (data.automationPriorities.length === 0) {
    errors.automationPriorities = 'Please select at least one automation priority'
  }

  return errors
}

export function isProfileValid(data: BusinessProfileData): boolean {
  const errors = validateBusinessProfile(data)
  return Object.keys(errors).length === 0
}

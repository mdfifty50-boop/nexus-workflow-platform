/**
 * Industry Configuration
 *
 * Industry-specific configurations for the business profile step.
 * Defines recommended integrations, templates, automation priorities,
 * and custom questions per industry type.
 */

import type {
  Industry,
  AutomationPriority,
  PainPoint,
} from './business-profile-types'

// ============================================================================
// INDUSTRY ICONS & GRADIENTS
// ============================================================================

export const INDUSTRY_ICONS: Record<Industry, string> = {
  ecommerce: 'ShoppingCart',
  saas: 'Code',
  agency: 'Megaphone',
  consulting: 'Briefcase',
  healthcare: 'Heart',
  finance: 'DollarSign',
  education: 'GraduationCap',
  realestate: 'Home',
  manufacturing: 'Factory',
  retail: 'Store',
  nonprofit: 'Users',
  other: 'Sparkles',
}

export const INDUSTRY_GRADIENTS: Record<Industry, string> = {
  ecommerce: 'from-orange-500 to-amber-500',
  saas: 'from-violet-500 to-purple-500',
  agency: 'from-pink-500 to-rose-500',
  consulting: 'from-blue-500 to-cyan-500',
  healthcare: 'from-red-500 to-pink-500',
  finance: 'from-emerald-500 to-green-500',
  education: 'from-indigo-500 to-blue-500',
  realestate: 'from-teal-500 to-cyan-500',
  manufacturing: 'from-slate-500 to-zinc-500',
  retail: 'from-amber-500 to-yellow-500',
  nonprofit: 'from-purple-500 to-pink-500',
  other: 'from-gray-500 to-slate-500',
}

// ============================================================================
// INDUSTRY CONFIGURATION
// ============================================================================

export interface IndustryConfig {
  name: string
  description: string
  icon: string
  gradient: string
  recommendedIntegrations: string[]
  recommendedTemplates: string[]
  suggestedPriorities: AutomationPriority[]
  commonPainPoints: PainPoint[]
  hasCustomFields: boolean
  customFieldsComponent: 'ecommerce' | 'saas' | 'agency' | null
}

export const INDUSTRY_CONFIGS: Record<Industry, IndustryConfig> = {
  ecommerce: {
    name: 'E-commerce / Online Retail',
    description: 'Online stores, dropshipping, marketplaces',
    icon: 'ShoppingCart',
    gradient: 'from-orange-500 to-amber-500',
    recommendedIntegrations: ['shopify', 'woocommerce', 'stripe', 'gmail', 'slack'],
    recommendedTemplates: ['order-notification', 'inventory-sync', 'shipping-updates'],
    suggestedPriorities: ['inventory', 'customer-support', 'invoicing', 'email'],
    commonPainPoints: ['time-consuming', 'scattered-tools', 'scaling-issues'],
    hasCustomFields: true,
    customFieldsComponent: 'ecommerce',
  },
  saas: {
    name: 'SaaS / Technology',
    description: 'Software products, apps, tech startups',
    icon: 'Code',
    gradient: 'from-violet-500 to-purple-500',
    recommendedIntegrations: ['stripe', 'intercom', 'slack', 'github', 'linear'],
    recommendedTemplates: ['user-onboarding', 'churn-prevention', 'feature-announcements'],
    suggestedPriorities: ['customer-support', 'crm', 'reporting', 'email'],
    commonPainPoints: ['scaling-issues', 'repetitive-tasks', 'no-visibility'],
    hasCustomFields: true,
    customFieldsComponent: 'saas',
  },
  agency: {
    name: 'Agency / Creative Services',
    description: 'Marketing, design, development agencies',
    icon: 'Megaphone',
    gradient: 'from-pink-500 to-rose-500',
    recommendedIntegrations: ['hubspot', 'mailchimp', 'slack', 'asana', 'figma'],
    recommendedTemplates: ['client-onboarding', 'campaign-reports', 'social-scheduler'],
    suggestedPriorities: ['crm', 'reporting', 'social', 'scheduling'],
    commonPainPoints: ['scattered-tools', 'poor-communication', 'process-delays'],
    hasCustomFields: true,
    customFieldsComponent: 'agency',
  },
  consulting: {
    name: 'Consulting / Professional Services',
    description: 'Business consulting, legal, accounting',
    icon: 'Briefcase',
    gradient: 'from-blue-500 to-cyan-500',
    recommendedIntegrations: ['calendly', 'gmail', 'slack', 'notion', 'quickbooks'],
    recommendedTemplates: ['client-onboarding', 'invoice-reminders', 'meeting-scheduler'],
    suggestedPriorities: ['scheduling', 'invoicing', 'crm', 'email'],
    commonPainPoints: ['time-consuming', 'process-delays', 'poor-communication'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  healthcare: {
    name: 'Healthcare',
    description: 'Medical practices, wellness, healthcare tech',
    icon: 'Heart',
    gradient: 'from-red-500 to-pink-500',
    recommendedIntegrations: ['gmail', 'calendly', 'slack', 'notion'],
    recommendedTemplates: ['appointment-reminders', 'patient-followup', 'intake-forms'],
    suggestedPriorities: ['scheduling', 'customer-support', 'data-entry', 'email'],
    commonPainPoints: ['time-consuming', 'error-prone', 'process-delays'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  finance: {
    name: 'Finance / Banking',
    description: 'Financial services, fintech, insurance',
    icon: 'DollarSign',
    gradient: 'from-emerald-500 to-green-500',
    recommendedIntegrations: ['quickbooks', 'xero', 'gmail', 'slack', 'sheets'],
    recommendedTemplates: ['invoice-processor', 'expense-reports', 'compliance-alerts'],
    suggestedPriorities: ['invoicing', 'reporting', 'data-entry', 'email'],
    commonPainPoints: ['error-prone', 'time-consuming', 'no-visibility'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  education: {
    name: 'Education',
    description: 'Schools, online courses, training',
    icon: 'GraduationCap',
    gradient: 'from-indigo-500 to-blue-500',
    recommendedIntegrations: ['gmail', 'slack', 'notion', 'calendly', 'zoom'],
    recommendedTemplates: ['enrollment-flow', 'course-reminders', 'student-feedback'],
    suggestedPriorities: ['scheduling', 'email', 'customer-support', 'reporting'],
    commonPainPoints: ['repetitive-tasks', 'poor-communication', 'time-consuming'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  realestate: {
    name: 'Real Estate',
    description: 'Property, rentals, property management',
    icon: 'Home',
    gradient: 'from-teal-500 to-cyan-500',
    recommendedIntegrations: ['gmail', 'calendly', 'sheets', 'docusign'],
    recommendedTemplates: ['lead-followup', 'property-alerts', 'tenant-reminders'],
    suggestedPriorities: ['crm', 'lead-gen', 'scheduling', 'email'],
    commonPainPoints: ['scattered-tools', 'process-delays', 'poor-communication'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  manufacturing: {
    name: 'Manufacturing',
    description: 'Production, supply chain, industrial',
    icon: 'Factory',
    gradient: 'from-slate-500 to-zinc-500',
    recommendedIntegrations: ['sheets', 'slack', 'gmail', 'quickbooks'],
    recommendedTemplates: ['inventory-alerts', 'order-tracking', 'supplier-comms'],
    suggestedPriorities: ['inventory', 'reporting', 'data-entry', 'email'],
    commonPainPoints: ['no-visibility', 'process-delays', 'error-prone'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  retail: {
    name: 'Retail / Brick & Mortar',
    description: 'Physical stores, local businesses',
    icon: 'Store',
    gradient: 'from-amber-500 to-yellow-500',
    recommendedIntegrations: ['square', 'gmail', 'slack', 'sheets'],
    recommendedTemplates: ['daily-sales-report', 'inventory-alerts', 'staff-scheduling'],
    suggestedPriorities: ['inventory', 'scheduling', 'reporting', 'email'],
    commonPainPoints: ['time-consuming', 'repetitive-tasks', 'no-visibility'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  nonprofit: {
    name: 'Non-profit',
    description: 'Charities, NGOs, community organizations',
    icon: 'Users',
    gradient: 'from-purple-500 to-pink-500',
    recommendedIntegrations: ['mailchimp', 'gmail', 'slack', 'notion'],
    recommendedTemplates: ['donor-thank-you', 'volunteer-coordination', 'campaign-updates'],
    suggestedPriorities: ['email', 'crm', 'marketing', 'reporting'],
    commonPainPoints: ['repetitive-tasks', 'scattered-tools', 'poor-communication'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
  other: {
    name: 'Other',
    description: 'Other industries or custom setup',
    icon: 'Sparkles',
    gradient: 'from-gray-500 to-slate-500',
    recommendedIntegrations: ['gmail', 'slack', 'sheets', 'notion', 'trello'],
    recommendedTemplates: ['email-automation', 'task-management', 'data-sync'],
    suggestedPriorities: ['email', 'scheduling', 'data-entry', 'reporting'],
    commonPainPoints: ['time-consuming', 'repetitive-tasks', 'scattered-tools'],
    hasCustomFields: false,
    customFieldsComponent: null,
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getIndustryConfig(industry: Industry | null): IndustryConfig | null {
  if (!industry) return null
  return INDUSTRY_CONFIGS[industry] || null
}

export function getRecommendedIntegrations(industry: Industry | null): string[] {
  if (!industry) return INDUSTRY_CONFIGS.other.recommendedIntegrations
  return INDUSTRY_CONFIGS[industry]?.recommendedIntegrations || []
}

export function getRecommendedTemplates(industry: Industry | null): string[] {
  if (!industry) return INDUSTRY_CONFIGS.other.recommendedTemplates
  return INDUSTRY_CONFIGS[industry]?.recommendedTemplates || []
}

export function getSuggestedPriorities(industry: Industry | null): AutomationPriority[] {
  if (!industry) return INDUSTRY_CONFIGS.other.suggestedPriorities
  return INDUSTRY_CONFIGS[industry]?.suggestedPriorities || []
}

export function getCommonPainPoints(industry: Industry | null): PainPoint[] {
  if (!industry) return INDUSTRY_CONFIGS.other.commonPainPoints
  return INDUSTRY_CONFIGS[industry]?.commonPainPoints || []
}

export function hasCustomFields(industry: Industry | null): boolean {
  if (!industry) return false
  return INDUSTRY_CONFIGS[industry]?.hasCustomFields || false
}

export function getCustomFieldsComponent(industry: Industry | null): 'ecommerce' | 'saas' | 'agency' | null {
  if (!industry) return null
  return INDUSTRY_CONFIGS[industry]?.customFieldsComponent || null
}

// ============================================================================
// TIMEZONE OPTIONS
// ============================================================================

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
] as const

export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/New_York'
  }
}

export function getTimezoneLabel(timezone: string): string {
  const found = COMMON_TIMEZONES.find(tz => tz.value === timezone)
  if (found) return found.label
  // Return the raw timezone value as fallback
  return timezone.replace(/_/g, ' ').replace(/\//g, ' / ')
}

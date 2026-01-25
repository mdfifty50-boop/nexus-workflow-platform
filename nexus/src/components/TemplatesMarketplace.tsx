import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { usePersonalization, type PersonaType } from '@/contexts/PersonalizationContext'
import { useToast } from '@/contexts/ToastContext'
import { getCustomTemplates } from './SaveAsTemplate'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  industry?: string
  icon: string
  popularity: number
  timeSaved: string
  successRate: number
  integrations: string[]
  steps: number
  agents: string[]
  isPremium: boolean
  isFeatured?: boolean
  isNew?: boolean
  isCustom?: boolean
  createdBy?: {
    type: 'nexus' | 'community' | 'partner'
    name?: string
  }
  rating?: number
  reviewCount?: number
  usageCount?: number
}

// =============================================================================
// ENHANCED CATEGORY SYSTEM
// =============================================================================

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: '📦', color: 'slate' },
  { id: 'favorites', label: 'Favorites', icon: '❤️', color: 'red' },
  { id: 'marketing', label: 'Marketing', icon: '📢', color: 'pink' },
  { id: 'sales', label: 'Sales', icon: '💼', color: 'blue' },
  { id: 'operations', label: 'Operations', icon: '⚙️', color: 'amber' },
  { id: 'hr', label: 'HR', icon: '👥', color: 'cyan' },
  { id: 'development', label: 'Development', icon: '💻', color: 'violet' },
  { id: 'finance', label: 'Finance', icon: '💰', color: 'emerald' },
  { id: 'customer', label: 'Customer Success', icon: '🎯', color: 'orange' },
  { id: 'meetings', label: 'Meetings', icon: '📝', color: 'purple' },
  { id: 'custom', label: 'My Templates', icon: '⭐', color: 'yellow' },
]

// =============================================================================
// FAVORITES TRACKING (localStorage)
// =============================================================================

const TEMPLATE_FAVORITES_KEY = 'nexus_template_favorites'

function getFavoriteTemplates(): string[] {
  try {
    const stored = localStorage.getItem(TEMPLATE_FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setFavoriteTemplates(favorites: string[]): void {
  localStorage.setItem(TEMPLATE_FAVORITES_KEY, JSON.stringify(favorites))
}

export function toggleFavorite(templateId: string): boolean {
  const favorites = getFavoriteTemplates()
  const index = favorites.indexOf(templateId)
  if (index === -1) {
    favorites.push(templateId)
    setFavoriteTemplates(favorites)
    return true // Now favorited
  } else {
    favorites.splice(index, 1)
    setFavoriteTemplates(favorites)
    return false // Now unfavorited
  }
}

export function isFavorite(templateId: string): boolean {
  return getFavoriteTemplates().includes(templateId)
}

// =============================================================================
// USAGE TRACKING (localStorage)
// =============================================================================

const TEMPLATE_USAGE_KEY = 'nexus_template_usage'

interface TemplateUsage {
  [templateId: string]: {
    count: number
    lastUsed: string
  }
}

function getTemplateUsage(): TemplateUsage {
  try {
    const stored = localStorage.getItem(TEMPLATE_USAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function trackTemplateUsage(templateId: string): void {
  const usage = getTemplateUsage()
  usage[templateId] = {
    count: (usage[templateId]?.count || 0) + 1,
    lastUsed: new Date().toISOString()
  }
  localStorage.setItem(TEMPLATE_USAGE_KEY, JSON.stringify(usage))
}

function getPopularTemplates(templates: WorkflowTemplate[], limit = 5): WorkflowTemplate[] {
  const usage = getTemplateUsage()
  return templates
    .map(t => ({ ...t, localUsageCount: usage[t.id]?.count || 0 }))
    .filter(t => t.localUsageCount > 0)
    .sort((a, b) => b.localUsageCount - a.localUsageCount)
    .slice(0, limit)
}

// =============================================================================
// SEARCH FILTER CHIPS
// =============================================================================

interface FilterChip {
  id: string
  label: string
  type: 'integration' | 'agent' | 'feature'
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'slack', label: 'Slack', type: 'integration' },
  { id: 'gmail', label: 'Gmail', type: 'integration' },
  { id: 'salesforce', label: 'Salesforce', type: 'integration' },
  { id: 'hubspot', label: 'HubSpot', type: 'integration' },
  { id: 'zoom', label: 'Zoom', type: 'integration' },
  { id: 'teams', label: 'Teams', type: 'integration' },
  { id: 'ai-powered', label: 'AI Powered', type: 'feature' },
  { id: 'premium', label: 'Premium', type: 'feature' },
  { id: 'new', label: 'New', type: 'feature' },
]

const SAMPLE_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'crm-lead-scoring',
    name: 'Smart Lead Scoring',
    description: 'Automatically score and prioritize leads based on behavior, engagement, and fit.',
    category: 'sales',
    icon: '🎯',
    popularity: 95,
    timeSaved: '8 hours/week',
    successRate: 97,
    integrations: ['Salesforce', 'HubSpot', 'Gmail'],
    steps: 5,
    agents: ['larry', 'sam'],
    isPremium: false,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 234,
    usageCount: 12500,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'email-followup',
    name: 'Automated Email Follow-ups',
    description: 'Send personalized follow-up emails at optimal times based on recipient behavior.',
    category: 'sales',
    icon: '📧',
    popularity: 92,
    timeSaved: '5 hours/week',
    successRate: 94,
    integrations: ['Gmail', 'Outlook', 'Salesforce'],
    steps: 4,
    agents: ['mary', 'sam'],
    isPremium: false,
    rating: 4.8,
    reviewCount: 189,
    usageCount: 8900,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'meeting-intelligence',
    name: 'Meeting Intelligence Suite',
    description: 'Record meetings, transcribe (including Arabic), extract action items, and auto-assign tasks.',
    category: 'meetings',
    industry: 'All',
    icon: '🎙️',
    popularity: 98,
    timeSaved: '10 hours/week',
    successRate: 96,
    integrations: ['Zoom', 'Teams', 'Calendar', 'Slack'],
    steps: 6,
    agents: ['nexus', 'larry', 'olivia'],
    isPremium: true,
    isFeatured: true,
    isNew: true,
    rating: 4.9,
    reviewCount: 156,
    usageCount: 6700,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'document-processing',
    name: 'Smart Document Processing',
    description: 'Extract data from invoices, contracts, and receipts using AI OCR.',
    category: 'operations',
    icon: '📄',
    popularity: 88,
    timeSaved: '6 hours/week',
    successRate: 92,
    integrations: ['Google Drive', 'Dropbox', 'Notion'],
    steps: 5,
    agents: ['alex', 'sam'],
    isPremium: false,
    rating: 4.7,
    reviewCount: 145,
    usageCount: 5400,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'social-scheduler',
    name: 'Social Media Scheduler',
    description: 'Generate, schedule, and publish content across all social platforms.',
    category: 'marketing',
    icon: '📱',
    popularity: 85,
    timeSaved: '7 hours/week',
    successRate: 95,
    integrations: ['LinkedIn', 'Twitter', 'Instagram', 'Buffer'],
    steps: 4,
    agents: ['emma', 'mary'],
    isPremium: false,
    rating: 4.6,
    reviewCount: 178,
    usageCount: 7200,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding Flow',
    description: 'Automated onboarding sequences with personalized welcome emails and setup guides.',
    category: 'customer',
    icon: '🚀',
    popularity: 90,
    timeSaved: '12 hours/week',
    successRate: 98,
    integrations: ['Intercom', 'Slack', 'Gmail', 'Notion'],
    steps: 8,
    agents: ['larry', 'emma', 'sam'],
    isPremium: true,
    rating: 4.8,
    reviewCount: 112,
    usageCount: 3400,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'expense-reports',
    name: 'Expense Report Automation',
    description: 'Process receipts, categorize expenses, and generate reports automatically.',
    category: 'finance',
    icon: '🧾',
    popularity: 82,
    timeSaved: '4 hours/week',
    successRate: 94,
    integrations: ['QuickBooks', 'Expensify', 'Slack'],
    steps: 5,
    agents: ['alex', 'olivia'],
    isPremium: false,
    rating: 4.5,
    reviewCount: 89,
    usageCount: 2800,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'whatsapp-support',
    name: 'WhatsApp Customer Support',
    description: 'Respond to customer inquiries on WhatsApp with AI-powered assistance.',
    category: 'customer',
    icon: '💬',
    popularity: 94,
    timeSaved: '15 hours/week',
    successRate: 91,
    integrations: ['WhatsApp', 'Zendesk', 'Salesforce'],
    steps: 4,
    agents: ['nexus', 'sam'],
    isPremium: true,
    isNew: true,
    rating: 4.7,
    reviewCount: 67,
    usageCount: 1900,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'candidate-screening',
    name: 'AI Candidate Screening',
    description: 'Screen resumes, rank candidates, and schedule interviews automatically.',
    category: 'hr',
    icon: '👤',
    popularity: 86,
    timeSaved: '10 hours/week',
    successRate: 89,
    integrations: ['LinkedIn', 'Greenhouse', 'Calendar'],
    steps: 6,
    agents: ['larry', 'mary'],
    isPremium: true,
    rating: 4.6,
    reviewCount: 78,
    usageCount: 2100,
    createdBy: { type: 'nexus' },
  },
  {
    id: 'weekly-reports',
    name: 'Weekly Business Reports',
    description: 'Aggregate data from multiple sources and generate executive summaries.',
    category: 'operations',
    icon: '📊',
    popularity: 91,
    timeSaved: '6 hours/week',
    successRate: 97,
    integrations: ['Google Sheets', 'Salesforce', 'Slack'],
    steps: 5,
    agents: ['larry', 'emma'],
    isPremium: false,
    rating: 4.8,
    reviewCount: 201,
    usageCount: 8100,
    createdBy: { type: 'nexus' },
  },
]

// Persona-specific template recommendations
const PERSONA_TEMPLATES: Record<string, WorkflowTemplate[]> = {
  doctor: [
    {
      id: 'patient-intake',
      name: 'Patient Intake Automation',
      description: 'Automate patient registration forms, insurance verification, and medical history collection.',
      category: 'healthcare',
      icon: '🏥',
      popularity: 96,
      timeSaved: '15 hours/week',
      successRate: 98,
      integrations: ['Epic', 'Cerner', 'Athenahealth', 'Insurance APIs'],
      steps: 8,
      agents: ['larry', 'mary', 'olivia'],
      isPremium: false,
      isFeatured: true,
      isNew: true,
      rating: 4.9,
      reviewCount: 312,
      usageCount: 15600,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'prior-auth',
      name: 'Prior Authorization Bot',
      description: 'Submit and track prior authorizations automatically, with appeals handling.',
      category: 'healthcare',
      icon: '📋',
      popularity: 94,
      timeSaved: '20 hours/week',
      successRate: 92,
      integrations: ['CoverMyMeds', 'Surescripts', 'Payer Portals'],
      steps: 10,
      agents: ['larry', 'sam', 'alex'],
      isPremium: true,
      rating: 4.8,
      reviewCount: 189,
      usageCount: 8900,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'clinical-notes',
      name: 'AI Clinical Documentation',
      description: 'Generate SOAP notes, procedure documentation, and discharge summaries from voice.',
      category: 'healthcare',
      icon: '📝',
      popularity: 98,
      timeSaved: '12 hours/week',
      successRate: 95,
      integrations: ['Epic', 'Dragon Medical', 'Nuance'],
      steps: 5,
      agents: ['larry', 'olivia'],
      isPremium: true,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 456,
      usageCount: 23400,
      createdBy: { type: 'nexus' },
    },
  ],
  lawyer: [
    {
      id: 'legal-intake',
      name: 'Client Intake & Conflicts',
      description: 'Automate new client intake, conflict checking, and retainer generation.',
      category: 'legal',
      icon: '⚖️',
      popularity: 95,
      timeSaved: '10 hours/week',
      successRate: 97,
      integrations: ['Clio', 'PracticePanther', 'LawPay'],
      steps: 7,
      agents: ['larry', 'mary', 'sam'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 267,
      usageCount: 12300,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'legal-research',
      name: 'AI Legal Research',
      description: 'Research case law, statutes, and regulations with AI-powered analysis.',
      category: 'legal',
      icon: '📚',
      popularity: 93,
      timeSaved: '25 hours/week',
      successRate: 91,
      integrations: ['Westlaw', 'LexisNexis', 'CourtListener'],
      steps: 6,
      agents: ['larry', 'alex', 'olivia'],
      isPremium: true,
      isNew: true,
      rating: 4.8,
      reviewCount: 145,
      usageCount: 6700,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'discovery-automation',
      name: 'E-Discovery Automation',
      description: 'Process discovery documents, redact PII, and generate privilege logs.',
      category: 'legal',
      icon: '🔍',
      popularity: 91,
      timeSaved: '30 hours/week',
      successRate: 94,
      integrations: ['Relativity', 'Logikcull', 'DocuSign'],
      steps: 9,
      agents: ['sam', 'alex', 'olivia'],
      isPremium: true,
      rating: 4.7,
      reviewCount: 98,
      usageCount: 4500,
      createdBy: { type: 'nexus' },
    },
  ],
  realtor: [
    {
      id: 'listing-automation',
      name: 'Smart Listing Manager',
      description: 'Auto-generate listings, sync to MLS, and create virtual tours from photos.',
      category: 'real-estate',
      icon: '🏠',
      popularity: 97,
      timeSaved: '12 hours/week',
      successRate: 96,
      integrations: ['Zillow', 'Realtor.com', 'MLS Systems'],
      steps: 6,
      agents: ['emma', 'larry', 'sam'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 389,
      usageCount: 18700,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'lead-nurturing',
      name: 'Real Estate Lead Nurturing',
      description: 'Automated drip campaigns, property alerts, and showing scheduling.',
      category: 'real-estate',
      icon: '🎯',
      popularity: 94,
      timeSaved: '8 hours/week',
      successRate: 93,
      integrations: ['Follow Up Boss', 'Calendly', 'Gmail'],
      steps: 5,
      agents: ['mary', 'sam'],
      isPremium: false,
      rating: 4.8,
      reviewCount: 234,
      usageCount: 11200,
      createdBy: { type: 'nexus' },
    },
  ],
  accountant: [
    {
      id: 'invoice-processing',
      name: 'Invoice Processing AI',
      description: 'Extract data from invoices, match to POs, and auto-post to GL.',
      category: 'finance',
      icon: '🧾',
      popularity: 96,
      timeSaved: '15 hours/week',
      successRate: 97,
      integrations: ['QuickBooks', 'Xero', 'SAP', 'NetSuite'],
      steps: 6,
      agents: ['alex', 'larry', 'olivia'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 445,
      usageCount: 21500,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'tax-prep',
      name: 'Tax Document Organizer',
      description: 'Collect, categorize, and prepare documents for tax filing.',
      category: 'finance',
      icon: '📊',
      popularity: 92,
      timeSaved: '20 hours/week',
      successRate: 95,
      integrations: ['TurboTax', 'Drake', 'UltraTax'],
      steps: 8,
      agents: ['larry', 'sam', 'olivia'],
      isPremium: true,
      isNew: true,
      rating: 4.8,
      reviewCount: 167,
      usageCount: 7800,
      createdBy: { type: 'nexus' },
    },
  ],
  developer: [
    {
      id: 'ci-cd-automation',
      name: 'CI/CD Pipeline Manager',
      description: 'Automate builds, tests, deployments, and rollbacks with AI monitoring.',
      category: 'devops',
      icon: '🚀',
      popularity: 95,
      timeSaved: '10 hours/week',
      successRate: 94,
      integrations: ['GitHub', 'GitLab', 'Jenkins', 'AWS'],
      steps: 7,
      agents: ['sam', 'alex', 'david'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 523,
      usageCount: 28900,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'code-review',
      name: 'AI Code Review Assistant',
      description: 'Automated PR reviews with security scanning and best practice suggestions.',
      category: 'devops',
      icon: '🔍',
      popularity: 94,
      timeSaved: '8 hours/week',
      successRate: 92,
      integrations: ['GitHub', 'GitLab', 'Bitbucket', 'SonarQube'],
      steps: 5,
      agents: ['alex', 'olivia'],
      isPremium: false,
      rating: 4.8,
      reviewCount: 412,
      usageCount: 19600,
      createdBy: { type: 'nexus' },
    },
  ],
  teacher: [
    {
      id: 'lesson-planning',
      name: 'AI Lesson Planner',
      description: 'Generate lesson plans, assessments, and differentiated materials.',
      category: 'education',
      icon: '📖',
      popularity: 96,
      timeSaved: '12 hours/week',
      successRate: 95,
      integrations: ['Google Classroom', 'Canvas', 'Schoology'],
      steps: 6,
      agents: ['larry', 'emma', 'mary'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 378,
      usageCount: 16700,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'grading-assistant',
      name: 'Smart Grading Assistant',
      description: 'Auto-grade assignments with detailed feedback and progress tracking.',
      category: 'education',
      icon: '✏️',
      popularity: 94,
      timeSaved: '15 hours/week',
      successRate: 93,
      integrations: ['Google Classroom', 'Turnitin', 'Gradescope'],
      steps: 5,
      agents: ['larry', 'olivia'],
      isPremium: true,
      rating: 4.8,
      reviewCount: 267,
      usageCount: 12400,
      createdBy: { type: 'nexus' },
    },
  ],
  recruiter: [
    {
      id: 'candidate-pipeline',
      name: 'AI Candidate Pipeline',
      description: 'Source, screen, and rank candidates with AI-powered matching.',
      category: 'hr',
      icon: '👥',
      popularity: 95,
      timeSaved: '20 hours/week',
      successRate: 91,
      integrations: ['LinkedIn', 'Greenhouse', 'Lever', 'Indeed'],
      steps: 8,
      agents: ['larry', 'mary', 'olivia'],
      isPremium: false,
      isFeatured: true,
      rating: 4.8,
      reviewCount: 289,
      usageCount: 13500,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'interview-scheduling',
      name: 'Interview Coordinator',
      description: 'Automate interview scheduling, reminders, and feedback collection.',
      category: 'hr',
      icon: '📅',
      popularity: 93,
      timeSaved: '8 hours/week',
      successRate: 96,
      integrations: ['Calendly', 'Google Calendar', 'Zoom', 'Teams'],
      steps: 5,
      agents: ['mary', 'sam'],
      isPremium: false,
      rating: 4.9,
      reviewCount: 345,
      usageCount: 16200,
      createdBy: { type: 'nexus' },
    },
  ],
  marketer: [
    {
      id: 'campaign-automation',
      name: 'Marketing Campaign Suite',
      description: 'Create, launch, and optimize multi-channel marketing campaigns.',
      category: 'marketing',
      icon: '📣',
      popularity: 96,
      timeSaved: '15 hours/week',
      successRate: 94,
      integrations: ['HubSpot', 'Mailchimp', 'Google Ads', 'Meta'],
      steps: 9,
      agents: ['emma', 'mary', 'sam'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 456,
      usageCount: 22800,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'content-calendar',
      name: 'AI Content Calendar',
      description: 'Plan, create, and schedule content across all platforms.',
      category: 'marketing',
      icon: '📱',
      popularity: 94,
      timeSaved: '10 hours/week',
      successRate: 95,
      integrations: ['Buffer', 'Hootsuite', 'Canva', 'LinkedIn'],
      steps: 6,
      agents: ['emma', 'larry'],
      isPremium: false,
      rating: 4.8,
      reviewCount: 367,
      usageCount: 17500,
      createdBy: { type: 'nexus' },
    },
  ],
  sales: [
    {
      id: 'lead-scoring',
      name: 'AI Lead Scoring',
      description: 'Score and prioritize leads based on behavior and fit.',
      category: 'sales',
      icon: '🎯',
      popularity: 97,
      timeSaved: '12 hours/week',
      successRate: 96,
      integrations: ['Salesforce', 'HubSpot', 'Outreach', 'Gong'],
      steps: 6,
      agents: ['larry', 'sam', 'mary'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 534,
      usageCount: 26700,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'proposal-generator',
      name: 'AI Proposal Generator',
      description: 'Create customized proposals and quotes in minutes.',
      category: 'sales',
      icon: '📑',
      popularity: 93,
      timeSaved: '8 hours/week',
      successRate: 94,
      integrations: ['PandaDoc', 'Proposify', 'DocuSign'],
      steps: 5,
      agents: ['emma', 'larry', 'olivia'],
      isPremium: true,
      rating: 4.8,
      reviewCount: 289,
      usageCount: 13400,
      createdBy: { type: 'nexus' },
    },
  ],
  ecommerce: [
    {
      id: 'order-fulfillment',
      name: 'Smart Order Fulfillment',
      description: 'Automate order processing, inventory sync, and shipping notifications.',
      category: 'operations',
      icon: '📦',
      popularity: 96,
      timeSaved: '20 hours/week',
      successRate: 98,
      integrations: ['Shopify', 'WooCommerce', 'ShipStation'],
      steps: 7,
      agents: ['sam', 'alex', 'olivia'],
      isPremium: false,
      isFeatured: true,
      rating: 4.9,
      reviewCount: 467,
      usageCount: 24300,
      createdBy: { type: 'nexus' },
    },
    {
      id: 'customer-support',
      name: 'E-commerce Support Bot',
      description: 'Handle customer inquiries, returns, and order tracking automatically.',
      category: 'customer',
      icon: '💬',
      popularity: 95,
      timeSaved: '30 hours/week',
      successRate: 93,
      integrations: ['Zendesk', 'Gorgias', 'Shopify', 'WhatsApp'],
      steps: 6,
      agents: ['nexus', 'mary', 'sam'],
      isPremium: true,
      rating: 4.8,
      reviewCount: 378,
      usageCount: 18900,
      createdBy: { type: 'nexus' },
    },
  ],
}

// Map personas to template keys
const getTemplatesForPersona = (persona: PersonaType): WorkflowTemplate[] => {
  if (PERSONA_TEMPLATES[persona]) {
    return PERSONA_TEMPLATES[persona]
  }

  // Map similar personas to existing templates
  const personaMapping: Record<string, string> = {
    therapist: 'doctor',
    nurse: 'doctor',
    paralegal: 'lawyer',
    financial_advisor: 'accountant',
    banker: 'accountant',
    property_manager: 'realtor',
    professor: 'teacher',
    consultant: 'sales',
    photographer: 'marketer',
    writer: 'marketer',
    engineer: 'developer',
    scientist: 'developer',
    designer: 'marketer',
    hr_manager: 'recruiter',
    project_manager: 'sales',
    operations: 'ecommerce',
    executive: 'sales',
    entrepreneur: 'sales',
    restaurant_owner: 'ecommerce',
    general: 'sales',
    custom: 'sales',
  }

  const mappedPersona = personaMapping[persona]
  if (mappedPersona && PERSONA_TEMPLATES[mappedPersona]) {
    return PERSONA_TEMPLATES[mappedPersona]
  }

  return []
}

// Persona display names
const PERSONA_DISPLAY_NAMES: Record<string, string> = {
  doctor: 'Healthcare',
  nurse: 'Healthcare',
  therapist: 'Healthcare',
  lawyer: 'Legal',
  paralegal: 'Legal',
  realtor: 'Real Estate',
  property_manager: 'Real Estate',
  accountant: 'Finance',
  financial_advisor: 'Finance',
  banker: 'Finance',
  teacher: 'Education',
  professor: 'Education',
  developer: 'Technology',
  engineer: 'Technology',
  scientist: 'Technology',
  designer: 'Creative',
  photographer: 'Creative',
  writer: 'Creative',
  sales: 'Sales',
  consultant: 'Sales',
  marketer: 'Marketing',
  recruiter: 'HR & Recruiting',
  hr_manager: 'HR & Recruiting',
  ecommerce: 'E-commerce',
  restaurant_owner: 'E-commerce',
  operations: 'Operations',
  project_manager: 'Operations',
  executive: 'Executive',
  entrepreneur: 'Business',
  general: 'Business',
  custom: 'Your Industry',
}

interface TemplateCardProps {
  template: WorkflowTemplate
  onUse: () => void
  onPreview: () => void
  isFavorited?: boolean
  onToggleFavorite?: () => void
}

// Category color mapping for visual distinction
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  sales: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  marketing: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  operations: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  meetings: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  hr: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  finance: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  customer: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
}

const getCategoryStyle = (category: string) => {
  return CATEGORY_COLORS[category] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
}

function TemplateCard({ template, onUse, onPreview, isFavorited, onToggleFavorite }: TemplateCardProps) {
  const categoryStyle = getCategoryStyle(template.category)
  const categoryLabel = TEMPLATE_CATEGORIES.find(c => c.id === template.category)?.label || template.category

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-cyan-500/50 transition-all group">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl">
              {template.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white">{template.name}</h3>
                {template.isNew && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    NEW
                  </span>
                )}
              </div>
              {/* Category Badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
                {categoryLabel}
              </span>
              {template.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-sm text-slate-400">
                    {template.rating} ({template.reviewCount})
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className={`
                  p-2 rounded-lg transition-all
                  ${isFavorited
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-700'}
                `}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg
                  className="w-5 h-5"
                  fill={isFavorited ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            )}
            {template.isPremium && (
              <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-xs font-medium border border-amber-500/30">
                PRO
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{template.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-slate-900/50">
            <div className="text-sm font-semibold text-cyan-400">{template.timeSaved}</div>
            <div className="text-xs text-slate-500">Saved</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-900/50">
            <div className="text-sm font-semibold text-emerald-400">{template.successRate}%</div>
            <div className="text-xs text-slate-500">Success</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-900/50">
            <div className="text-sm font-semibold text-purple-400">{template.steps}</div>
            <div className="text-xs text-slate-500">Steps</div>
          </div>
        </div>

        {/* Agents */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center -space-x-2">
            {template.agents.slice(0, 3).map((agent, i) => (
              <div key={agent} className="relative" style={{ zIndex: 3 - i }}>
                <ProfessionalAvatar agentId={agent} size={28} />
              </div>
            ))}
            {template.agents.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 border border-slate-600">
                +{template.agents.length - 3}
              </div>
            )}
          </div>
          {template.usageCount && (
            <span className="text-xs text-slate-500">
              {template.usageCount.toLocaleString()} uses
            </span>
          )}
        </div>

        {/* Integrations */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.integrations.slice(0, 4).map(integration => (
            <span key={integration} className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-400">
              {integration}
            </span>
          ))}
          {template.integrations.length > 4 && (
            <span className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-400">
              +{template.integrations.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex gap-2">
        <Button
          onClick={onPreview}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Preview
        </Button>
        <Button onClick={onUse} size="sm" className="flex-1">
          Use Template
        </Button>
      </div>
    </div>
  )
}

interface TemplatesMarketplaceProps {
  onSelectTemplate: (template: WorkflowTemplate) => void
  onPreviewTemplate: (template: WorkflowTemplate) => void
  userPlan?: 'free' | 'starter' | 'pro' | 'enterprise'
}

// Export usage tracking for external use
export { trackTemplateUsage, getTemplateUsage, getPopularTemplates }

export function TemplatesMarketplace({
  onSelectTemplate,
  onPreviewTemplate,
  userPlan = 'free',
}: TemplatesMarketplaceProps) {
  const { persona, customPersonaLabel } = usePersonalization()
  const toast = useToast()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [customTemplates, setCustomTemplates] = useState<WorkflowTemplate[]>([])

  // Load custom templates from localStorage
  useEffect(() => {
    const loadCustomTemplates = () => {
      const templates = getCustomTemplates()
      setCustomTemplates(templates.map(t => ({
        ...t,
        popularity: 50,
        rating: undefined,
        reviewCount: undefined,
        usageCount: undefined
      })))
    }
    loadCustomTemplates()

    // Listen for storage changes
    const handleStorageChange = () => loadCustomTemplates()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Combine all templates
  const allTemplates = useMemo(() => {
    return [...SAMPLE_TEMPLATES, ...customTemplates]
  }, [customTemplates])

  // Get persona-specific templates
  const personaTemplates = useMemo(() => getTemplatesForPersona(persona), [persona])
  const personaDisplayName = persona === 'custom' && customPersonaLabel
    ? customPersonaLabel
    : PERSONA_DISPLAY_NAMES[persona] || 'Your Industry'

  // Popular templates based on local usage
  const popularTemplates = useMemo(() => {
    return getPopularTemplates(allTemplates, 5)
  }, [allTemplates])

  // Toggle filter chip
  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }, [])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = selectedCategory === 'custom'
      ? customTemplates
      : allTemplates

    // Apply category filter
    if (selectedCategory !== 'all' && selectedCategory !== 'custom') {
      templates = templates.filter(t => t.category === selectedCategory)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.integrations.some(i => i.toLowerCase().includes(query)) ||
        t.category.toLowerCase().includes(query)
      )
    }

    // Apply filter chips
    if (activeFilters.length > 0) {
      templates = templates.filter(t => {
        return activeFilters.every(filter => {
          const chip = FILTER_CHIPS.find(c => c.id === filter)
          if (!chip) return true

          switch (chip.type) {
            case 'integration':
              return t.integrations.some(i =>
                i.toLowerCase().includes(filter.toLowerCase())
              )
            case 'feature':
              if (filter === 'premium') return t.isPremium
              if (filter === 'new') return t.isNew
              if (filter === 'ai-powered') return t.agents.length > 0
              return true
            default:
              return true
          }
        })
      })
    }

    // Sort
    return templates.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.popularity - a.popularity
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        default:
          return 0
      }
    })
  }, [allTemplates, customTemplates, selectedCategory, searchQuery, activeFilters, sortBy])

  const featuredTemplates = SAMPLE_TEMPLATES.filter(t => t.isFeatured)

  const canUsePremium = userPlan !== 'free'

  // Handle template selection with usage tracking
  const handleSelectTemplate = useCallback((template: WorkflowTemplate) => {
    trackTemplateUsage(template.id)
    onSelectTemplate(template)
  }, [onSelectTemplate])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflow Templates</h1>
          <p className="text-slate-400">Pre-built automations ready to use in minutes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-64"
            />
            {/* Live search results count */}
            {searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  filteredTemplates.length > 0
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {filteredTemplates.length}
                </span>
              </div>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-slate-400 py-1.5">Quick filters:</span>
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.id}
            onClick={() => toggleFilter(chip.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeFilters.includes(chip.id)
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600'
            }`}
          >
            {chip.label}
            {activeFilters.includes(chip.id) && (
              <span className="ml-1.5">x</span>
            )}
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Popular Templates Section - Based on local usage */}
      {selectedCategory === 'all' && searchQuery === '' && activeFilters.length === 0 && popularTemplates.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-2xl border border-amber-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h2 className="text-lg font-semibold text-white">Your Popular Templates</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                TOP {popularTemplates.length}
              </span>
            </div>
            <span className="text-sm text-slate-400">Based on your usage</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {popularTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                      {template.name}
                    </h3>
                    <div className="text-xs text-slate-500">
                      {(template as any).localUsageCount || 0} uses
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended for You - Persona-Specific Section */}
      {selectedCategory === 'all' && searchQuery === '' && personaTemplates.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-semibold text-white">Recommended for {personaDisplayName}</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                PERSONALIZED
              </span>
            </div>
            <span className="text-sm text-slate-400">Based on your profession</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personaTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => {
                  if (template.isPremium && !canUsePremium) {
                    toast.info('Upgrade to Pro to unlock premium templates')
                    return
                  }
                  onSelectTemplate(template)
                }}
                onPreview={() => onPreviewTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Featured Section */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <div className="bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-cyan-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⭐</span>
            <h2 className="text-lg font-semibold text-white">Featured Templates</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => onSelectTemplate(template)}
                onPreview={() => onPreviewTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TEMPLATE_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
              ${selectedCategory === category.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
              }
            `}
          >
            <span>{category.icon}</span>
            <span className="font-medium">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={() => {
              if (template.isPremium && !canUsePremium) {
                // Show upgrade modal
                toast.info('Upgrade to Pro to unlock premium templates')
                return
              }
              onSelectTemplate(template)
            }}
            onPreview={() => onPreviewTemplate(template)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
          <p className="text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Request Template CTA */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Can't find what you need?</h3>
        <p className="text-slate-400 mb-4">Our AI can build custom workflows for your specific needs</p>
        <Button variant="outline">
          Request Custom Template
        </Button>
      </div>
    </div>
  )
}

// Template Preview Modal
interface TemplatePreviewModalProps {
  template: WorkflowTemplate
  onClose: () => void
  onUse: () => void
}

export function TemplatePreviewModal({ template, onClose, onUse }: TemplatePreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-3xl">
                {template.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  {template.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400">★</span>
                      <span className="text-slate-400">{template.rating}</span>
                    </div>
                  )}
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{template.usageCount?.toLocaleString()} uses</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          <p className="text-slate-300 mb-6">{template.description}</p>

          {/* Workflow Steps Preview */}
          <h3 className="text-lg font-semibold text-white mb-4">Workflow Steps</h3>
          <div className="space-y-3 mb-6">
            {template.agents.map((agent, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  {i + 1}
                </div>
                <ProfessionalAvatar agentId={agent} size={36} />
                <div>
                  <p className="text-white font-medium capitalize">{agent}</p>
                  <p className="text-sm text-slate-400">Processes step {i + 1}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Integrations */}
          <h3 className="text-lg font-semibold text-white mb-4">Required Integrations</h3>
          <div className="flex flex-wrap gap-2">
            {template.integrations.map(integration => (
              <span key={integration} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm">
                {integration}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onUse} className="flex-1">
            Use This Template
          </Button>
        </div>
      </div>
    </div>
  )
}

export { SAMPLE_TEMPLATES }

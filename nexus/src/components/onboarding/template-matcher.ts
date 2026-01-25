/**
 * Template Matcher
 *
 * Smart recommendation matching logic for workflow templates.
 * Matches templates to user's business profile, connected apps, and goals.
 */

import type {
  BusinessProfile,
  TemplateMetadata,
  TemplateRecommendation,
  RecommendationGroup,
  RecommendationResult,
  BusinessIndustry,
  UserGoal,
  RecommendationCategory,
  ComplexityLevel,
} from './template-recommendation-types'

import {
  RECOMMENDATION_CATEGORIES,
  CATEGORY_DISPLAY_INFO,
  BUSINESS_INDUSTRIES,
  USER_GOALS,
  COMPLEXITY_LEVELS,
} from './template-recommendation-types'

// ============================================================================
// Mock Template Data
// ============================================================================

/**
 * Get mock template data for recommendations
 * In production, this would come from an API or the existing template systems
 */
export function getMockTemplates(): TemplateMetadata[] {
  return [
    // E-commerce templates
    {
      id: 'shopify-new-order-notification',
      name: 'New Order Notification',
      description: 'Get instant Slack and email notifications when you receive a new order. Never miss a sale again.',
      category: 'order',
      source: 'shopify',
      complexity: COMPLEXITY_LEVELS.BEGINNER,
      requiredApps: ['shopify', 'slack', 'gmail'],
      estimatedSetupTime: '3 min',
      estimatedTimeSaved: '5 hours/week',
      tags: ['notification', 'slack', 'email', 'real-time', 'orders'],
      steps: [
        { id: '1', name: 'New Order Trigger', description: 'Watch for new Shopify orders', appId: 'shopify' },
        { id: '2', name: 'Format Order', description: 'Format order details', icon: 'FileText' },
        { id: '3', name: 'Send Slack Message', description: 'Notify team on Slack', appId: 'slack' },
        { id: '4', name: 'Send Email', description: 'Send confirmation email', appId: 'gmail' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.ECOMMERCE],
      targetGoals: [USER_GOALS.SAVE_TIME, USER_GOALS.IMPROVE_COMMUNICATION],
      rating: 4.8,
      usageCount: 12500,
      isStaffPick: true,
      isNew: false,
    },
    {
      id: 'shopify-low-stock-alert',
      name: 'Low Stock Alert',
      description: 'Get notified when inventory drops below threshold. Automatically send reorder requests to suppliers.',
      category: 'inventory',
      source: 'shopify',
      complexity: COMPLEXITY_LEVELS.BEGINNER,
      requiredApps: ['shopify', 'slack', 'gmail', 'googlesheets'],
      estimatedSetupTime: '5 min',
      estimatedTimeSaved: '3 hours/week',
      tags: ['inventory', 'alert', 'reorder', 'supplier'],
      steps: [
        { id: '1', name: 'Inventory Update Trigger', description: 'Monitor inventory levels', appId: 'shopify' },
        { id: '2', name: 'Check Threshold', description: 'Compare against minimum stock', icon: 'AlertTriangle' },
        { id: '3', name: 'Alert Team', description: 'Send Slack notification', appId: 'slack' },
        { id: '4', name: 'Email Supplier', description: 'Request reorder', appId: 'gmail' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.ECOMMERCE],
      targetGoals: [USER_GOALS.REDUCE_ERRORS, USER_GOALS.SAVE_TIME],
      rating: 4.6,
      usageCount: 8200,
      isStaffPick: false,
      isNew: false,
    },
    {
      id: 'shopify-abandoned-cart-recovery',
      name: 'Abandoned Cart Recovery',
      description: 'Automatically send personalized email sequences to recover abandoned checkouts and boost revenue.',
      category: 'marketing',
      source: 'shopify',
      complexity: COMPLEXITY_LEVELS.ADVANCED,
      requiredApps: ['shopify', 'gmail', 'googlesheets'],
      estimatedSetupTime: '15 min',
      estimatedTimeSaved: '10 hours/week',
      tags: ['recovery', 'email', 'revenue', 'automation', 'marketing'],
      steps: [
        { id: '1', name: 'Abandoned Cart Trigger', description: 'Detect abandoned checkouts', appId: 'shopify' },
        { id: '2', name: 'Wait Period', description: 'Wait 1 hour before sending', icon: 'Clock' },
        { id: '3', name: 'Generate Email', description: 'Create personalized content', icon: 'Sparkles' },
        { id: '4', name: 'Send Recovery Email', description: 'Send reminder to customer', appId: 'gmail' },
        { id: '5', name: 'Log to Sheets', description: 'Track recovery attempts', appId: 'googlesheets' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.ECOMMERCE],
      targetGoals: [USER_GOALS.INCREASE_REVENUE, USER_GOALS.CUSTOMER_SATISFACTION],
      rating: 4.9,
      usageCount: 15000,
      isStaffPick: true,
      isNew: false,
    },
    {
      id: 'shopify-vip-customer-tagging',
      name: 'VIP Customer Auto-Tagging',
      description: 'Automatically identify and tag VIP customers based on total spending thresholds.',
      category: 'customer',
      source: 'shopify',
      complexity: COMPLEXITY_LEVELS.INTERMEDIATE,
      requiredApps: ['shopify', 'slack', 'gmail'],
      estimatedSetupTime: '8 min',
      estimatedTimeSaved: '4 hours/week',
      tags: ['vip', 'customer', 'loyalty', 'tagging', 'segmentation'],
      steps: [
        { id: '1', name: 'Order Paid Trigger', description: 'Watch for paid orders', appId: 'shopify' },
        { id: '2', name: 'Calculate Lifetime Value', description: 'Sum customer spending', icon: 'Calculator' },
        { id: '3', name: 'Assign VIP Tier', description: 'Bronze, Silver, or Gold', icon: 'Award' },
        { id: '4', name: 'Update Customer Tags', description: 'Tag in Shopify', appId: 'shopify' },
        { id: '5', name: 'Notify Sales', description: 'Alert on new VIP', appId: 'slack' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.ECOMMERCE],
      targetGoals: [USER_GOALS.CUSTOMER_SATISFACTION, USER_GOALS.INCREASE_REVENUE],
      rating: 4.5,
      usageCount: 5600,
      isStaffPick: false,
      isNew: true,
    },

    // CRM/Sales templates
    {
      id: 'crm-lead-followup',
      name: 'CRM Lead Follow-up',
      description: 'Automatically schedule follow-ups for new leads and send reminders. Never miss an opportunity.',
      category: 'sales',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.INTERMEDIATE,
      requiredApps: ['hubspot', 'gmail', 'slack'],
      estimatedSetupTime: '5 min',
      estimatedTimeSaved: '6 hours/week',
      tags: ['crm', 'leads', 'followup', 'sales', 'automation'],
      steps: [
        { id: '1', name: 'New Lead Trigger', description: 'Detect new CRM lead', appId: 'hubspot' },
        { id: '2', name: 'Schedule Follow-up', description: 'Create task for 24h later', icon: 'Calendar' },
        { id: '3', name: 'Send Welcome Email', description: 'Initial outreach', appId: 'gmail' },
        { id: '4', name: 'Notify Sales Rep', description: 'Alert on Slack', appId: 'slack' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.PROFESSIONAL_SERVICES, BUSINESS_INDUSTRIES.SAAS, BUSINESS_INDUSTRIES.MARKETING_AGENCY],
      targetGoals: [USER_GOALS.INCREASE_REVENUE, USER_GOALS.TEAM_PRODUCTIVITY],
      rating: 4.7,
      usageCount: 9800,
      isStaffPick: true,
      isNew: false,
    },
    {
      id: 'crm-customer-sync',
      name: 'Customer to CRM Sync',
      description: 'Automatically sync new customers to HubSpot or Salesforce CRM with complete details.',
      category: 'crm',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.INTERMEDIATE,
      requiredApps: ['shopify', 'hubspot', 'googlesheets'],
      estimatedSetupTime: '10 min',
      estimatedTimeSaved: '5 hours/week',
      tags: ['crm', 'sync', 'hubspot', 'salesforce', 'automation'],
      steps: [
        { id: '1', name: 'New Customer Trigger', description: 'Detect new customer', appId: 'shopify' },
        { id: '2', name: 'Check Existing', description: 'Search for duplicates', appId: 'hubspot' },
        { id: '3', name: 'Create/Update Contact', description: 'Sync to CRM', appId: 'hubspot' },
        { id: '4', name: 'Log Sync', description: 'Record in spreadsheet', appId: 'googlesheets' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.ECOMMERCE, BUSINESS_INDUSTRIES.SAAS, BUSINESS_INDUSTRIES.PROFESSIONAL_SERVICES],
      targetGoals: [USER_GOALS.REDUCE_ERRORS, USER_GOALS.SAVE_TIME],
      rating: 4.4,
      usageCount: 7200,
      isStaffPick: false,
      isNew: false,
    },

    // Support templates
    {
      id: 'support-ticket-alert',
      name: 'Support Ticket Alerts',
      description: 'Get instant Slack notifications for high-priority support tickets. Reduce response time by 40%.',
      category: 'support',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.BEGINNER,
      requiredApps: ['zendesk', 'slack'],
      estimatedSetupTime: '2 min',
      estimatedTimeSaved: '4 hours/week',
      tags: ['support', 'zendesk', 'slack', 'alerts', 'priority'],
      steps: [
        { id: '1', name: 'New Ticket Trigger', description: 'Monitor support tickets', appId: 'zendesk' },
        { id: '2', name: 'Check Priority', description: 'Filter high-priority', icon: 'AlertCircle' },
        { id: '3', name: 'Send Alert', description: 'Notify support team', appId: 'slack' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.SAAS, BUSINESS_INDUSTRIES.ECOMMERCE, BUSINESS_INDUSTRIES.PROFESSIONAL_SERVICES],
      targetGoals: [USER_GOALS.CUSTOMER_SATISFACTION, USER_GOALS.TEAM_PRODUCTIVITY],
      rating: 4.6,
      usageCount: 6500,
      isStaffPick: false,
      isNew: false,
    },
    {
      id: 'support-ticket-triage',
      name: 'AI Ticket Triage',
      description: 'Use AI to automatically categorize, prioritize, and route support tickets to the right team.',
      category: 'support',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.ADVANCED,
      requiredApps: ['zendesk', 'slack'],
      estimatedSetupTime: '12 min',
      estimatedTimeSaved: '8 hours/week',
      tags: ['support', 'ai', 'triage', 'automation', 'routing'],
      steps: [
        { id: '1', name: 'New Ticket Trigger', description: 'Monitor incoming tickets', appId: 'zendesk' },
        { id: '2', name: 'AI Analysis', description: 'Analyze sentiment and category', icon: 'Sparkles' },
        { id: '3', name: 'Assign Priority', description: 'Set urgency level', icon: 'AlertTriangle' },
        { id: '4', name: 'Route to Team', description: 'Assign to appropriate agent', appId: 'zendesk' },
        { id: '5', name: 'Notify Team', description: 'Alert on Slack', appId: 'slack' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.SAAS, BUSINESS_INDUSTRIES.ECOMMERCE],
      targetGoals: [USER_GOALS.CUSTOMER_SATISFACTION, USER_GOALS.TEAM_PRODUCTIVITY, USER_GOALS.SAVE_TIME],
      rating: 4.8,
      usageCount: 4200,
      isStaffPick: true,
      isNew: true,
    },

    // Marketing templates
    {
      id: 'daily-email-digest',
      name: 'Daily Email Digest',
      description: 'Get a daily AI-powered summary of important emails sent to your Slack channel.',
      category: 'marketing',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.BEGINNER,
      requiredApps: ['gmail', 'slack'],
      estimatedSetupTime: '3 min',
      estimatedTimeSaved: '3 hours/week',
      tags: ['email', 'digest', 'slack', 'daily', 'summary'],
      steps: [
        { id: '1', name: 'Schedule Trigger', description: 'Run daily at 9 AM', icon: 'Clock' },
        { id: '2', name: 'Fetch Emails', description: 'Get unread important emails', appId: 'gmail' },
        { id: '3', name: 'AI Summary', description: 'Generate key points', icon: 'Sparkles' },
        { id: '4', name: 'Send to Slack', description: 'Post digest to channel', appId: 'slack' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.PROFESSIONAL_SERVICES, BUSINESS_INDUSTRIES.MARKETING_AGENCY, BUSINESS_INDUSTRIES.SAAS, BUSINESS_INDUSTRIES.OTHER],
      targetGoals: [USER_GOALS.SAVE_TIME, USER_GOALS.IMPROVE_COMMUNICATION],
      rating: 4.5,
      usageCount: 11000,
      isStaffPick: false,
      isNew: false,
    },
    {
      id: 'social-mention-monitor',
      name: 'Social Mention Monitor',
      description: 'Track brand mentions across social media and get instant alerts with sentiment analysis.',
      category: 'marketing',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.INTERMEDIATE,
      requiredApps: ['slack', 'googlesheets'],
      estimatedSetupTime: '5 min',
      estimatedTimeSaved: '5 hours/week',
      tags: ['social', 'monitoring', 'brand', 'marketing', 'sentiment'],
      steps: [
        { id: '1', name: 'Monitor Mentions', description: 'Track brand keywords', icon: 'Search' },
        { id: '2', name: 'Analyze Sentiment', description: 'AI determines tone', icon: 'Sparkles' },
        { id: '3', name: 'Alert Team', description: 'Slack notification', appId: 'slack' },
        { id: '4', name: 'Log to Sheets', description: 'Track over time', appId: 'googlesheets' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.MARKETING_AGENCY, BUSINESS_INDUSTRIES.ECOMMERCE, BUSINESS_INDUSTRIES.SAAS],
      targetGoals: [USER_GOALS.BETTER_INSIGHTS, USER_GOALS.CUSTOMER_SATISFACTION],
      rating: 4.3,
      usageCount: 3800,
      isStaffPick: false,
      isNew: false,
    },

    // Productivity templates
    {
      id: 'meeting-notes-sync',
      name: 'Meeting Notes to Notion',
      description: 'Automatically transcribe and summarize meetings, then save organized notes to Notion.',
      category: 'productivity',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.INTERMEDIATE,
      requiredApps: ['calendar', 'notion', 'slack'],
      estimatedSetupTime: '7 min',
      estimatedTimeSaved: '4 hours/week',
      tags: ['meeting', 'notes', 'notion', 'transcription', 'productivity'],
      steps: [
        { id: '1', name: 'Meeting End Trigger', description: 'Detect completed meeting', appId: 'calendar' },
        { id: '2', name: 'Transcribe Audio', description: 'Convert to text', icon: 'Mic' },
        { id: '3', name: 'AI Summary', description: 'Extract key points', icon: 'Sparkles' },
        { id: '4', name: 'Save to Notion', description: 'Create meeting page', appId: 'notion' },
        { id: '5', name: 'Notify Attendees', description: 'Share on Slack', appId: 'slack' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.PROFESSIONAL_SERVICES, BUSINESS_INDUSTRIES.MARKETING_AGENCY, BUSINESS_INDUSTRIES.SAAS],
      targetGoals: [USER_GOALS.TEAM_PRODUCTIVITY, USER_GOALS.SAVE_TIME],
      rating: 4.7,
      usageCount: 5100,
      isStaffPick: true,
      isNew: false,
    },
    {
      id: 'invoice-processing',
      name: 'Invoice Processor',
      description: 'Extract data from invoices using AI, validate, and sync to QuickBooks automatically.',
      category: 'finance',
      source: 'custom',
      complexity: COMPLEXITY_LEVELS.ADVANCED,
      requiredApps: ['gmail', 'quickbooks', 'googlesheets'],
      estimatedSetupTime: '15 min',
      estimatedTimeSaved: '6 hours/week',
      tags: ['invoice', 'finance', 'quickbooks', 'automation', 'accounting'],
      steps: [
        { id: '1', name: 'Email Trigger', description: 'Detect invoice attachment', appId: 'gmail' },
        { id: '2', name: 'Extract Data', description: 'AI reads invoice', icon: 'Sparkles' },
        { id: '3', name: 'Validate Data', description: 'Check for errors', icon: 'CheckCircle' },
        { id: '4', name: 'Create in QuickBooks', description: 'Record expense', appId: 'quickbooks' },
        { id: '5', name: 'Log to Sheets', description: 'Track all invoices', appId: 'googlesheets' },
      ],
      targetIndustries: [BUSINESS_INDUSTRIES.PROFESSIONAL_SERVICES, BUSINESS_INDUSTRIES.MARKETING_AGENCY],
      targetGoals: [USER_GOALS.REDUCE_ERRORS, USER_GOALS.SAVE_TIME],
      rating: 4.4,
      usageCount: 3200,
      isStaffPick: false,
      isNew: false,
    },
  ]
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate industry match score
 */
function calculateIndustryScore(template: TemplateMetadata, industry: BusinessIndustry | null): number {
  if (!industry) return 0
  if (template.targetIndustries.includes(industry)) return 100
  // Partial match for 'other' industry
  if (industry === BUSINESS_INDUSTRIES.OTHER && template.targetIndustries.length > 2) return 50
  return 0
}

/**
 * Calculate goals match score
 */
function calculateGoalsScore(template: TemplateMetadata, goals: UserGoal[]): number {
  if (goals.length === 0) return 0
  const matchCount = template.targetGoals.filter(g => goals.includes(g)).length
  return Math.min(100, (matchCount / goals.length) * 100)
}

/**
 * Calculate connected apps match score
 */
function calculateAppsScore(template: TemplateMetadata, connectedApps: string[]): number {
  if (connectedApps.length === 0) return 0
  const matchCount = template.requiredApps.filter(app => connectedApps.includes(app)).length
  const requiredCount = template.requiredApps.length
  // Higher score if all required apps are connected
  if (matchCount === requiredCount) return 100
  return Math.min(80, (matchCount / requiredCount) * 100)
}

/**
 * Calculate complexity match score based on experience
 */
function calculateComplexityScore(template: TemplateMetadata, hasExperience: boolean): number {
  if (hasExperience) {
    // Experienced users might prefer more complex templates
    if (template.complexity === COMPLEXITY_LEVELS.ADVANCED) return 80
    if (template.complexity === COMPLEXITY_LEVELS.INTERMEDIATE) return 100
    return 70
  } else {
    // New users should start with simpler templates
    if (template.complexity === COMPLEXITY_LEVELS.BEGINNER) return 100
    if (template.complexity === COMPLEXITY_LEVELS.INTERMEDIATE) return 60
    return 30
  }
}

/**
 * Calculate popularity score
 */
function calculatePopularityScore(template: TemplateMetadata): number {
  // Normalize usage count (assuming max is around 20000)
  const usageScore = Math.min(100, (template.usageCount / 15000) * 100)
  // Rating contributes to score
  const ratingScore = (template.rating / 5) * 100
  // Staff picks get a bonus
  const staffPickBonus = template.isStaffPick ? 20 : 0
  // New templates get a small bonus
  const newBonus = template.isNew ? 10 : 0

  return Math.min(100, (usageScore * 0.3 + ratingScore * 0.5 + staffPickBonus + newBonus))
}

/**
 * Calculate overall match score
 */
function calculateMatchScore(template: TemplateMetadata, profile: BusinessProfile): number {
  const industryScore = calculateIndustryScore(template, profile.industry)
  const goalsScore = calculateGoalsScore(template, profile.goals)
  const appsScore = calculateAppsScore(template, profile.connectedApps)
  const complexityScore = calculateComplexityScore(template, profile.hasAutomationExperience)
  const popularityScore = calculatePopularityScore(template)

  // Weighted average
  const weights = {
    industry: 0.25,
    goals: 0.20,
    apps: 0.25,
    complexity: 0.15,
    popularity: 0.15,
  }

  return Math.round(
    industryScore * weights.industry +
    goalsScore * weights.goals +
    appsScore * weights.apps +
    complexityScore * weights.complexity +
    popularityScore * weights.popularity
  )
}

/**
 * Generate match reason text
 */
function generateMatchReason(template: TemplateMetadata, profile: BusinessProfile): string {
  const reasons: string[] = []

  // Check industry match
  if (profile.industry && template.targetIndustries.includes(profile.industry)) {
    reasons.push('matches your industry')
  }

  // Check apps match
  const matchedApps = template.requiredApps.filter(app => profile.connectedApps.includes(app))
  if (matchedApps.length === template.requiredApps.length) {
    reasons.push('ready with your connected apps')
  } else if (matchedApps.length > 0) {
    reasons.push(`uses ${matchedApps.length} of your apps`)
  }

  // Check goals match
  const matchedGoals = template.targetGoals.filter(g => profile.goals.includes(g))
  if (matchedGoals.length > 0) {
    const goalMap: Record<UserGoal, string> = {
      [USER_GOALS.SAVE_TIME]: 'save time',
      [USER_GOALS.REDUCE_ERRORS]: 'reduce errors',
      [USER_GOALS.IMPROVE_COMMUNICATION]: 'improve communication',
      [USER_GOALS.INCREASE_REVENUE]: 'increase revenue',
      [USER_GOALS.BETTER_INSIGHTS]: 'get better insights',
      [USER_GOALS.CUSTOMER_SATISFACTION]: 'improve customer satisfaction',
      [USER_GOALS.TEAM_PRODUCTIVITY]: 'boost team productivity',
    }
    reasons.push(`helps you ${goalMap[matchedGoals[0]]}`)
  }

  // Check complexity
  if (!profile.hasAutomationExperience && template.complexity === COMPLEXITY_LEVELS.BEGINNER) {
    reasons.push('perfect for beginners')
  }

  // Popularity/rating
  if (template.isStaffPick) {
    reasons.push('staff pick')
  } else if (template.rating >= 4.7) {
    reasons.push('highly rated')
  }

  if (reasons.length === 0) {
    return 'Popular automation'
  }

  // Capitalize first reason and join
  const result = reasons.slice(0, 2).join(' and ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

// ============================================================================
// Categorization Functions
// ============================================================================

/**
 * Determine recommendation category for a template
 */
function determineCategory(template: TemplateMetadata, profile: BusinessProfile, score: number): RecommendationCategory {
  // Staff picks take priority
  if (template.isStaffPick && score > 50) {
    return RECOMMENDATION_CATEGORIES.STAFF_PICKS
  }

  // Check if all required apps are connected
  const allAppsConnected = template.requiredApps.every(app => profile.connectedApps.includes(app))
  if (allAppsConnected && profile.connectedApps.length > 0) {
    return RECOMMENDATION_CATEGORIES.CONNECTED_APPS
  }

  // Industry specific
  if (profile.industry && template.targetIndustries.includes(profile.industry)) {
    return RECOMMENDATION_CATEGORIES.INDUSTRY_SPECIFIC
  }

  // Beginner friendly
  if (!profile.hasAutomationExperience && template.complexity === COMPLEXITY_LEVELS.BEGINNER) {
    return RECOMMENDATION_CATEGORIES.GETTING_STARTED
  }

  // Advanced
  if (template.complexity === COMPLEXITY_LEVELS.ADVANCED) {
    return RECOMMENDATION_CATEGORIES.ADVANCED_AUTOMATION
  }

  // Quick wins (short setup time, good value)
  if (parseInt(template.estimatedSetupTime) <= 5 && score > 40) {
    return RECOMMENDATION_CATEGORIES.QUICK_WINS
  }

  // Default to getting started
  return RECOMMENDATION_CATEGORIES.GETTING_STARTED
}

// ============================================================================
// Main Recommendation Functions
// ============================================================================

/**
 * Generate personalized template recommendations
 */
export function generateRecommendations(profile: BusinessProfile): RecommendationResult {
  const templates = getMockTemplates()

  // Score and categorize all templates
  const scoredTemplates: TemplateRecommendation[] = templates.map(template => {
    const score = calculateMatchScore(template, profile)
    const category = determineCategory(template, profile, score)
    const matchReason = generateMatchReason(template, profile)

    return {
      template,
      score,
      matchReason,
      category,
      rank: 0, // Will be set after sorting
    }
  })

  // Sort by score descending
  scoredTemplates.sort((a, b) => b.score - a.score)

  // Group by category
  const categoryGroups = new Map<RecommendationCategory, TemplateRecommendation[]>()

  for (const rec of scoredTemplates) {
    const existing = categoryGroups.get(rec.category) || []
    if (existing.length < 6) {
      // Limit per category
      rec.rank = existing.length + 1
      existing.push(rec)
      categoryGroups.set(rec.category, existing)
    }
  }

  // Convert to groups with display info
  const groups: RecommendationGroup[] = []

  // Order categories for display
  const categoryOrder: RecommendationCategory[] = [
    RECOMMENDATION_CATEGORIES.STAFF_PICKS,
    RECOMMENDATION_CATEGORIES.CONNECTED_APPS,
    RECOMMENDATION_CATEGORIES.INDUSTRY_SPECIFIC,
    RECOMMENDATION_CATEGORIES.GETTING_STARTED,
    RECOMMENDATION_CATEGORIES.QUICK_WINS,
    RECOMMENDATION_CATEGORIES.ADVANCED_AUTOMATION,
  ]

  for (const category of categoryOrder) {
    const recommendations = categoryGroups.get(category)
    if (recommendations && recommendations.length > 0) {
      const displayInfo = CATEGORY_DISPLAY_INFO[category]
      groups.push({
        category,
        title: displayInfo.title,
        description: displayInfo.description,
        recommendations,
        icon: displayInfo.icon,
      })
    }
  }

  return {
    groups,
    totalCount: scoredTemplates.length,
    profile,
    generatedAt: Date.now(),
  }
}

/**
 * Get top N recommendations across all categories
 */
export function getTopRecommendations(profile: BusinessProfile, count: number = 6): TemplateRecommendation[] {
  const result = generateRecommendations(profile)
  const allRecs = result.groups.flatMap(g => g.recommendations)

  // Sort by score and return top N
  allRecs.sort((a, b) => b.score - a.score)
  return allRecs.slice(0, count)
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string, profile: BusinessProfile): TemplateRecommendation[] {
  const templates = getMockTemplates()
  const lowerQuery = query.toLowerCase()

  const filtered = templates.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    template.category.toLowerCase().includes(lowerQuery)
  )

  return filtered.map((template, index) => ({
    template,
    score: calculateMatchScore(template, profile),
    matchReason: generateMatchReason(template, profile),
    category: determineCategory(template, profile, calculateMatchScore(template, profile)),
    rank: index + 1,
  }))
}

/**
 * Filter templates by category
 */
export function filterByCategory(category: string, profile: BusinessProfile): TemplateRecommendation[] {
  const templates = getMockTemplates()
  const filtered = templates.filter(t => t.category === category)

  return filtered.map((template, index) => ({
    template,
    score: calculateMatchScore(template, profile),
    matchReason: generateMatchReason(template, profile),
    category: determineCategory(template, profile, calculateMatchScore(template, profile)),
    rank: index + 1,
  }))
}

/**
 * Filter templates by complexity
 */
export function filterByComplexity(complexity: ComplexityLevel, profile: BusinessProfile): TemplateRecommendation[] {
  const templates = getMockTemplates()
  const filtered = templates.filter(t => t.complexity === complexity)

  return filtered.map((template, index) => ({
    template,
    score: calculateMatchScore(template, profile),
    matchReason: generateMatchReason(template, profile),
    category: determineCategory(template, profile, calculateMatchScore(template, profile)),
    rank: index + 1,
  }))
}

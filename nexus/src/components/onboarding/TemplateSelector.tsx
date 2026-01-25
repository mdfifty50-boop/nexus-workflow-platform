/**
 * TemplateSelector Component
 *
 * Displays a grid of workflow templates for user selection during onboarding.
 * Features:
 * - Card-based template display with category filters
 * - Search/filter functionality
 * - Visual preview of workflow steps
 * - Difficulty badges and required apps indicators
 * - One-click selection with recommendations based on business type
 *
 * Integrates with Shopify and WooCommerce template systems.
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BusinessType } from '@/hooks/useOnboarding'

// Import template systems
import {
  getShopifyTemplates,
  type ShopifyTemplate
} from '@/lib/workflow-engine/integrations/shopify/shopify-templates'
import {
  getWooCommerceTemplates,
  type WooCommerceTemplate
} from '@/lib/workflow-engine/integrations/woocommerce/woocommerce-templates'

// ============================================================================
// Types
// ============================================================================

export type TemplateCategory = 'all' | 'e-commerce' | 'marketing' | 'support' | 'inventory' | 'customer' | 'order' | 'fulfillment'
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface TemplateCardProps {
  id: string
  name: string
  description: string
  category: string
  difficulty: TemplateDifficulty
  requiredApps: string[]
  estimatedSetupTime: string
  estimatedTimeSavings?: string
  selected?: boolean
  recommended?: boolean
  onSelect: (id: string) => void
  steps?: Array<{ name: string; description: string }>
}

export interface TemplateSelectorProps {
  businessType?: BusinessType | null
  selectedTemplateId?: string | null
  onSelectTemplate: (templateId: string, template: UnifiedTemplate) => void
  onPreviewTemplate?: (templateId: string) => void
}

export interface UnifiedTemplate {
  id: string
  name: string
  description: string
  category: string
  source: 'shopify' | 'woocommerce' | 'custom'
  difficulty: TemplateDifficulty
  requiredApps: string[]
  estimatedSetupTime: string
  estimatedTimeSavings: string
  tags: string[]
  steps: Array<{ name: string; description: string }>
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'all', label: 'All Templates', icon: '📋' },
  { value: 'e-commerce', label: 'E-Commerce', icon: '🛒' },
  { value: 'order', label: 'Orders', icon: '📦' },
  { value: 'inventory', label: 'Inventory', icon: '📊' },
  { value: 'customer', label: 'Customer', icon: '👥' },
  { value: 'marketing', label: 'Marketing', icon: '📣' },
  { value: 'support', label: 'Support', icon: '🎧' },
  { value: 'fulfillment', label: 'Fulfillment', icon: '🚚' },
]

const DIFFICULTY_COLORS: Record<TemplateDifficulty, string> = {
  beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

const DIFFICULTY_LABELS: Record<TemplateDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

// App icon mapping for visual display
const APP_ICONS: Record<string, string> = {
  shopify: '🛍️',
  woocommerce: '🔮',
  slack: '💬',
  gmail: '📧',
  googlesheets: '📊',
  hubspot: '🧡',
  quickbooks: '💰',
  zendesk: '🎫',
  stripe: '💳',
  salesforce: '☁️',
  intercom: '💭',
  notion: '📝',
  trello: '📌',
  sheets: '📊',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts Shopify templates to unified format
 */
function convertShopifyTemplate(template: ShopifyTemplate): UnifiedTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    source: 'shopify',
    difficulty: template.difficulty as TemplateDifficulty,
    requiredApps: template.requiredConnections,
    estimatedSetupTime: getSetupTimeFromDifficulty(template.difficulty),
    estimatedTimeSavings: template.estimatedSavings.perMonth,
    tags: template.tags,
    steps: template.steps.map(step => ({
      name: step.name,
      description: step.description,
    })),
  }
}

/**
 * Converts WooCommerce templates to unified format
 */
function convertWooCommerceTemplate(template: WooCommerceTemplate): UnifiedTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    source: 'woocommerce',
    difficulty: template.difficulty as TemplateDifficulty,
    requiredApps: template.requiredConnections,
    estimatedSetupTime: getSetupTimeFromDifficulty(template.difficulty),
    estimatedTimeSavings: template.estimatedSavings.perMonth,
    tags: template.tags,
    steps: template.steps.map(step => ({
      name: step.name,
      description: step.description,
    })),
  }
}

/**
 * Estimates setup time based on difficulty
 */
function getSetupTimeFromDifficulty(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return '2-5 min'
    case 'intermediate':
      return '5-10 min'
    case 'advanced':
      return '10-15 min'
    default:
      return '5 min'
  }
}

/**
 * Maps template category to display category
 */
function mapToDisplayCategory(category: string): TemplateCategory {
  const mapping: Record<string, TemplateCategory> = {
    order: 'order',
    inventory: 'inventory',
    customer: 'customer',
    fulfillment: 'fulfillment',
    marketing: 'marketing',
    support: 'support',
  }
  return mapping[category] || 'e-commerce'
}

// ============================================================================
// TemplateCard Component
// ============================================================================

function TemplateCard({
  id,
  name,
  description,
  category,
  difficulty,
  requiredApps,
  estimatedSetupTime,
  estimatedTimeSavings,
  selected = false,
  recommended = false,
  onSelect,
  steps = [],
}: TemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleClick = useCallback(() => {
    onSelect(id)
  }, [id, onSelect])

  const handleExpandToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card
        className={`
          cursor-pointer transition-all duration-300 hover:shadow-lg
          ${selected
            ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/50'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
          }
        `}
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg text-white truncate flex items-center gap-2">
                {name}
                {recommended && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium">
                    Recommended
                  </span>
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-slate-400 line-clamp-2">
                {description}
              </CardDescription>
            </div>
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge
              className={`${DIFFICULTY_COLORS[difficulty]} border text-xs`}
            >
              {DIFFICULTY_LABELS[difficulty]}
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
              {category}
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
              {estimatedSetupTime}
            </Badge>
          </div>

          {/* Required Apps */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1.5">Required Apps:</p>
            <div className="flex flex-wrap gap-1.5">
              {requiredApps.slice(0, 4).map(app => (
                <span
                  key={app}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-300"
                >
                  <span>{APP_ICONS[app] || '🔗'}</span>
                  <span className="capitalize">{app}</span>
                </span>
              ))}
              {requiredApps.length > 4 && (
                <span className="px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-400">
                  +{requiredApps.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Time Savings */}
          {estimatedTimeSavings && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span>💡</span>
              <span>{estimatedTimeSavings}</span>
            </div>
          )}

          {/* Expandable Steps Preview */}
          <AnimatePresence>
            {isExpanded && steps.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-slate-700 overflow-hidden"
              >
                <p className="text-xs text-slate-500 mb-2">Workflow Steps:</p>
                <div className="space-y-2">
                  {steps.slice(0, 4).map((step, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{step.name}</p>
                        <p className="text-xs text-slate-500 truncate">{step.description}</p>
                      </div>
                    </div>
                  ))}
                  {steps.length > 4 && (
                    <p className="text-xs text-slate-500 ml-7">
                      +{steps.length - 4} more steps
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="pt-0">
          <button
            onClick={handleExpandToggle}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <span>Hide steps</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Preview steps ({steps.length})</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// TemplateSelector Component
// ============================================================================

export function TemplateSelector({
  businessType,
  selectedTemplateId,
  onSelectTemplate,
  onPreviewTemplate: _onPreviewTemplate,
}: TemplateSelectorProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<TemplateDifficulty | 'all'>('all')

  // Load and merge all templates
  const allTemplates = useMemo((): UnifiedTemplate[] => {
    const shopifyTemplates = getShopifyTemplates().map(convertShopifyTemplate)
    const wooCommerceTemplates = getWooCommerceTemplates().map(convertWooCommerceTemplate)

    // Combine and add some custom templates for non-e-commerce use cases
    const customTemplates: UnifiedTemplate[] = [
      {
        id: 'custom-email-digest',
        name: 'Daily Email Digest',
        description: 'Get a daily summary of important emails sent to your Slack channel.',
        category: 'marketing',
        source: 'custom',
        difficulty: 'beginner',
        requiredApps: ['gmail', 'slack'],
        estimatedSetupTime: '3 min',
        estimatedTimeSavings: 'Save ~3 hours/week on email management',
        tags: ['email', 'digest', 'slack', 'daily'],
        steps: [
          { name: 'Fetch Emails', description: 'Get unread important emails from Gmail' },
          { name: 'Generate Summary', description: 'AI summarizes key points' },
          { name: 'Send to Slack', description: 'Post digest to your channel' },
        ],
      },
      {
        id: 'custom-support-ticket-alert',
        name: 'Support Ticket Alerts',
        description: 'Get instant Slack notifications for high-priority support tickets.',
        category: 'support',
        source: 'custom',
        difficulty: 'beginner',
        requiredApps: ['zendesk', 'slack'],
        estimatedSetupTime: '2 min',
        estimatedTimeSavings: 'Reduce response time by 40%',
        tags: ['support', 'zendesk', 'slack', 'alerts'],
        steps: [
          { name: 'Monitor Tickets', description: 'Watch for new high-priority tickets' },
          { name: 'Check Priority', description: 'Filter by priority level' },
          { name: 'Send Alert', description: 'Notify support team in Slack' },
        ],
      },
      {
        id: 'custom-crm-lead-followup',
        name: 'CRM Lead Follow-up',
        description: 'Automatically schedule follow-ups for new leads and send reminders.',
        category: 'customer',
        source: 'custom',
        difficulty: 'intermediate',
        requiredApps: ['hubspot', 'gmail', 'slack'],
        estimatedSetupTime: '5 min',
        estimatedTimeSavings: 'Never miss a follow-up, 20% more conversions',
        tags: ['crm', 'leads', 'followup', 'sales'],
        steps: [
          { name: 'New Lead Alert', description: 'Detect new lead in CRM' },
          { name: 'Schedule Follow-up', description: 'Create task for 24h later' },
          { name: 'Send Reminder', description: 'Email and Slack notification' },
        ],
      },
      {
        id: 'custom-social-monitor',
        name: 'Social Mention Monitor',
        description: 'Track brand mentions across social media and get instant alerts.',
        category: 'marketing',
        source: 'custom',
        difficulty: 'intermediate',
        requiredApps: ['slack', 'sheets'],
        estimatedSetupTime: '5 min',
        estimatedTimeSavings: 'Save ~5 hours/week on social monitoring',
        tags: ['social', 'monitoring', 'brand', 'marketing'],
        steps: [
          { name: 'Monitor Mentions', description: 'Track brand keywords' },
          { name: 'Analyze Sentiment', description: 'AI determines tone' },
          { name: 'Alert & Log', description: 'Slack alert and log to Sheets' },
        ],
      },
    ]

    return [...shopifyTemplates, ...wooCommerceTemplates, ...customTemplates]
  }, [])

  // Determine recommended templates based on business type
  const recommendedTemplateIds = useMemo(() => {
    if (!businessType) return []

    const recommendations: Record<BusinessType, string[]> = {
      ecommerce: [
        'shopify-new-order-notification',
        'woocommerce-new-order-notification',
        'shopify-low-stock-alert',
        'woocommerce-low-stock-alert',
      ],
      crm: [
        'shopify-customer-crm-sync',
        'woocommerce-customer-crm-sync',
        'custom-crm-lead-followup',
        'shopify-vip-customer-tagging',
      ],
      support: [
        'custom-support-ticket-alert',
        'custom-email-digest',
      ],
      custom: [
        'custom-email-digest',
        'custom-crm-lead-followup',
        'shopify-new-order-notification',
      ],
    }

    return recommendations[businessType] || []
  }, [businessType])

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(template => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const templateCategory = mapToDisplayCategory(template.category)
        // Also match 'e-commerce' for order, inventory, fulfillment categories
        if (selectedCategory === 'e-commerce') {
          if (!['order', 'inventory', 'customer', 'fulfillment'].includes(template.category)) {
            if (templateCategory !== selectedCategory) return false
          }
        } else {
          if (templateCategory !== selectedCategory && template.category !== selectedCategory) {
            return false
          }
        }
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all') {
        if (template.difficulty !== selectedDifficulty) return false
      }

      return true
    })
  }, [allTemplates, searchQuery, selectedCategory, selectedDifficulty])

  // Sort templates with recommended first
  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      const aRecommended = recommendedTemplateIds.includes(a.id) ? 1 : 0
      const bRecommended = recommendedTemplateIds.includes(b.id) ? 1 : 0
      if (aRecommended !== bRecommended) return bRecommended - aRecommended

      // Then sort by difficulty (beginner first)
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 }
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    })
  }, [filteredTemplates, recommendedTemplateIds])

  const handleSelectTemplate = useCallback((templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId)
    if (template) {
      onSelectTemplate(templateId, template)
    }
  }, [allTemplates, onSelectTemplate])

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {t('onboarding.templates.title', 'Choose a Workflow Template')}
        </h2>
        <p className="text-slate-400">
          {t('onboarding.templates.subtitle', 'Start with a pre-built template and customize it to your needs')}
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6 space-y-4"
      >
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('onboarding.templates.searchPlaceholder', 'Search templates...')}
            className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500"
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
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedCategory(option.value)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${selectedCategory === option.value
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                }
              `}
            >
              <span className="mr-1.5">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Difficulty:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedDifficulty === 'all'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {(['beginner', 'intermediate', 'advanced'] as TemplateDifficulty[]).map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedDifficulty === diff
                    ? DIFFICULTY_COLORS[diff]
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {DIFFICULTY_LABELS[diff]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-4 flex items-center justify-between"
      >
        <p className="text-sm text-slate-500">
          {sortedTemplates.length} {sortedTemplates.length === 1 ? 'template' : 'templates'} found
        </p>
        {recommendedTemplateIds.length > 0 && (
          <p className="text-xs text-cyan-400">
            Recommended templates shown first
          </p>
        )}
      </motion.div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {sortedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              name={template.name}
              description={template.description}
              category={template.category}
              difficulty={template.difficulty}
              requiredApps={template.requiredApps}
              estimatedSetupTime={template.estimatedSetupTime}
              estimatedTimeSavings={template.estimatedTimeSavings}
              selected={selectedTemplateId === template.id}
              recommended={recommendedTemplateIds.includes(template.id)}
              onSelect={handleSelectTemplate}
              steps={template.steps}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sortedTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
          <p className="text-slate-400 mb-4">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setSelectedDifficulty('all')
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Clear filters
          </button>
        </motion.div>
      )}

      {/* Selected Template Action */}
      {selectedTemplateId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800 border border-cyan-500 shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-white font-medium">Template selected</span>
            <span className="text-cyan-400">Ready to customize</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default TemplateSelector

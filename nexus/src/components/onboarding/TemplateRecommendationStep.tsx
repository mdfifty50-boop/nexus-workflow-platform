/**
 * TemplateRecommendationStep Component
 *
 * Smart template suggestions for the onboarding flow.
 * Recommends workflow templates based on:
 * - User's business profile (industry, size, goals)
 * - Connected integrations
 * - Automation experience level
 *
 * Features:
 * - Personalized recommendation categories
 * - Template preview cards with workflow steps
 * - Search and filter functionality
 * - Template preview modal
 * - Save for later / bookmark
 * - Skip and create custom workflow option
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  X,
  Rocket,
  Building,
  Link,
  Zap,
  Settings,
  Star,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  PlusCircle,
} from 'lucide-react'

import { TemplatePreviewCard } from './TemplatePreviewCard'
import {
  generateRecommendations,
  searchTemplates,
  getMockTemplates,
} from './template-matcher'
import type {
  TemplateRecommendationStepProps,
  TemplateMetadata,
  RecommendationGroup,
  RecommendationCategory,
  ComplexityLevel,
} from './template-recommendation-types'
import {
  RECOMMENDATION_CATEGORIES,
  COMPLEXITY_LEVELS,
  COMPLEXITY_DISPLAY_INFO,
  APP_INFO_MAP,
} from './template-recommendation-types'

// ============================================================================
// Icon Mapping for Categories
// ============================================================================

const CategoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Building,
  Link,
  Zap,
  Settings,
  Star,
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Category section header
 */
function CategoryHeader({
  group,
  isExpanded,
  onToggle,
}: {
  group: RecommendationGroup
  isExpanded: boolean
  onToggle: () => void
}) {
  const IconComponent = CategoryIcons[group.icon] || Zap

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="text-left">
          <h3 className="text-base font-semibold text-white">{group.title}</h3>
          <p className="text-xs text-slate-400">{group.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-slate-600 text-slate-400">
          {group.recommendations.length} templates
        </Badge>
        <ChevronRight
          className={`w-5 h-5 text-slate-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </div>
    </button>
  )
}

/**
 * Filter pills for complexity
 */
function ComplexityFilter({
  selected,
  onSelect,
}: {
  selected: ComplexityLevel | 'all'
  onSelect: (level: ComplexityLevel | 'all') => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-slate-500">Difficulty:</span>
      <button
        onClick={() => onSelect('all')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
          selected === 'all'
            ? 'bg-slate-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        All
      </button>
      {Object.entries(COMPLEXITY_LEVELS).map(([_key, value]) => {
        void _key // Satisfy linter for unused variable
        const info = COMPLEXITY_DISPLAY_INFO[value]
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selected === value
                ? `${info.bgColor} ${info.color} ${info.borderColor} border`
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {info.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Template preview modal
 */
function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}: {
  template: TemplateMetadata | null
  isOpen: boolean
  onClose: () => void
  onUseTemplate: (id: string) => void
}) {
  if (!template) return null

  const complexityInfo = COMPLEXITY_DISPLAY_INFO[template.complexity]

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl text-white flex items-center gap-2">
                {template.name}
                {template.isStaffPick && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Staff Pick
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="mt-2 text-slate-400">
                {template.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${complexityInfo.bgColor} ${complexityInfo.color} ${complexityInfo.borderColor} border`}>
              {complexityInfo.label}
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {template.estimatedSetupTime} setup
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Saves {template.estimatedTimeSaved}
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {template.rating.toFixed(1)}
            </Badge>
          </div>

          {/* Required Apps */}
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Required Integrations</h4>
            <div className="flex flex-wrap gap-2">
              {template.requiredApps.map(appId => {
                const appInfo = APP_INFO_MAP[appId]
                return (
                  <span
                    key={appId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-sm text-slate-300"
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: appInfo?.color || '#64748b' }}
                    >
                      {(appInfo?.name || appId).charAt(0)}
                    </div>
                    <span className="capitalize">{appInfo?.name || appId}</span>
                  </span>
                )
              })}
            </div>
          </div>

          {/* Workflow Steps */}
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Workflow Steps</h4>
            <ScrollArea className="h-48">
              <div className="space-y-3 pr-4">
                {template.steps.map((step, index) => {
                  const appInfo = step.appId ? APP_INFO_MAP[step.appId] : null
                  return (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {appInfo ? (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: appInfo.color }}
                          >
                            {appInfo.name.charAt(0)}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{step.name}</p>
                        <p className="text-xs text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {template.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onUseTemplate(template.id)}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Use This Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplateRecommendationStep({
  businessProfile,
  selectedTemplateId,
  onSelectTemplate,
  onPreviewTemplate,
  onSkip,
  onSaveForLater,
}: TemplateRecommendationStepProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [complexityFilter, setComplexityFilter] = useState<ComplexityLevel | 'all'>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<RecommendationCategory>>(
    new Set([RECOMMENDATION_CATEGORIES.STAFF_PICKS, RECOMMENDATION_CATEGORIES.CONNECTED_APPS])
  )
  const [previewTemplate, setPreviewTemplate] = useState<TemplateMetadata | null>(null)
  const [savedTemplates, setSavedTemplates] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'categorized' | 'all'>('categorized')

  // Generate recommendations based on profile
  const recommendations = useMemo(() => {
    return generateRecommendations(businessProfile)
  }, [businessProfile])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    return searchTemplates(searchQuery, businessProfile)
  }, [searchQuery, businessProfile])

  // Filter results by complexity
  const filteredGroups = useMemo(() => {
    if (complexityFilter === 'all') return recommendations.groups

    return recommendations.groups
      .map(group => ({
        ...group,
        recommendations: group.recommendations.filter(
          rec => rec.template.complexity === complexityFilter
        ),
      }))
      .filter(group => group.recommendations.length > 0)
  }, [recommendations.groups, complexityFilter])

  // All templates for "all" view mode
  const allTemplates = useMemo(() => {
    const templates = getMockTemplates()
    if (complexityFilter === 'all') return templates
    return templates.filter(t => t.complexity === complexityFilter)
  }, [complexityFilter])

  // Handlers
  const handleToggleCategory = useCallback((category: RecommendationCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleSelectTemplate = useCallback(
    (template: TemplateMetadata) => {
      onSelectTemplate(template.id, template)
    },
    [onSelectTemplate]
  )

  const handlePreviewTemplate = useCallback(
    (template: TemplateMetadata) => {
      setPreviewTemplate(template)
      onPreviewTemplate?.(template.id)
    },
    [onPreviewTemplate]
  )

  const handleSaveForLater = useCallback(
    (templateId: string) => {
      setSavedTemplates(prev => {
        const next = new Set(prev)
        if (next.has(templateId)) {
          next.delete(templateId)
        } else {
          next.add(templateId)
        }
        return next
      })
      onSaveForLater?.(templateId)
    },
    [onSaveForLater]
  )

  const handleUseTemplate = useCallback(
    (templateId: string) => {
      const template = getMockTemplates().find(t => t.id === templateId)
      if (template) {
        onSelectTemplate(templateId, template)
        setPreviewTemplate(null)
      }
    },
    [onSelectTemplate]
  )

  // Auto-expand first category with connected apps
  useEffect(() => {
    if (businessProfile.connectedApps.length > 0) {
      setExpandedCategories(prev => {
        const next = new Set(prev)
        next.add(RECOMMENDATION_CATEGORIES.CONNECTED_APPS)
        return next
      })
    }
  }, [businessProfile.connectedApps])

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium">Personalized for you</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Recommended Templates
        </h2>
        <p className="text-slate-400">
          Based on your profile, here are the best workflow templates to get started
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-10 py-3 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ComplexityFilter selected={complexityFilter} onSelect={setComplexityFilter} />

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('categorized')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'categorized'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All Templates
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {searchQuery && searchResults && (
          <motion.div
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">
                {searchResults.length} results for "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Clear search
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.slice(0, 9).map(rec => (
                <TemplatePreviewCard
                  key={rec.template.id}
                  template={rec.template}
                  isSelected={selectedTemplateId === rec.template.id}
                  isRecommended={rec.score >= 70}
                  matchReason={rec.matchReason}
                  onClick={() => handleSelectTemplate(rec.template)}
                  onPreview={() => handlePreviewTemplate(rec.template)}
                  onSaveForLater={() => handleSaveForLater(rec.template.id)}
                />
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
                <p className="text-slate-400">Try a different search term</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Categorized View */}
        {!searchQuery && viewMode === 'categorized' && (
          <motion.div
            key="categorized-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredGroups.map((group, groupIndex) => (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1, duration: 0.4 }}
              >
                <CategoryHeader
                  group={group}
                  isExpanded={expandedCategories.has(group.category)}
                  onToggle={() => handleToggleCategory(group.category)}
                />

                <AnimatePresence>
                  {expandedCategories.has(group.category) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {group.recommendations.map(rec => (
                          <TemplatePreviewCard
                            key={rec.template.id}
                            template={rec.template}
                            isSelected={selectedTemplateId === rec.template.id}
                            isRecommended={rec.score >= 70}
                            matchReason={rec.matchReason}
                            onClick={() => handleSelectTemplate(rec.template)}
                            onPreview={() => handlePreviewTemplate(rec.template)}
                            onSaveForLater={() => handleSaveForLater(rec.template.id)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* All Templates View */}
        {!searchQuery && viewMode === 'all' && (
          <motion.div
            key="all-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">
                {allTemplates.length} templates available
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTemplates.map(template => (
                <TemplatePreviewCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  onClick={() => handleSelectTemplate(template)}
                  onPreview={() => handlePreviewTemplate(template)}
                  onSaveForLater={() => handleSaveForLater(template.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredGroups.length === 0 && !searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No templates match filters</h3>
          <p className="text-slate-400 mb-4">Try adjusting your filters</p>
          <Button
            variant="outline"
            onClick={() => setComplexityFilter('all')}
          >
            Clear filters
          </Button>
        </motion.div>
      )}

      {/* Selected Template Indicator */}
      {selectedTemplateId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800 border border-cyan-500 shadow-lg shadow-cyan-500/20">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">Template selected</span>
            <span className="text-cyan-400">Ready to use</span>
          </div>
        </motion.div>
      )}

      {/* Skip / Custom Workflow Option */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-center"
      >
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-slate-400 hover:text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Skip and create custom workflow
            </Button>
          )}
          {savedTemplates.size > 0 && (
            <Button variant="outline" className="text-slate-400">
              <span className="mr-2">Saved: {savedTemplates.size}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  )
}

export default TemplateRecommendationStep

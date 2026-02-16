import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Star,
  Clock,
  Zap,
  Users,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Heart,
  Copy,
  Globe,
} from 'lucide-react'
import clsx from 'clsx'
import { WorkflowTemplatesService, type WorkflowTemplate, type TemplateCategory } from '@/services/WorkflowTemplatesService'

// ============================================
// SERVICE INTEGRATION: WorkflowTemplatesService
// Replaces hardcoded templates with service-managed data
// ============================================

// Tool emoji mappings for visual display
const TOOL_EMOJIS: Record<string, string> = {
  gmail: '📧',
  slack: '💬',
  googlesheets: '📊',
  notion: '📝',
  whatsapp: '💚',
  hubspot: '🎯',
  googlecalendar: '📅',
  zoom: '🎥',
  stripe: '💳',
  github: '🐙',
  dropbox: '📦',
  googledrive: '☁️',
  twitter: '🐦',
  trello: '📋',
  asana: '✅',
}

// Gradient colors by category
const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  'email-automation': 'from-blue-500 to-cyan-500',
  'communication': 'from-purple-500 to-pink-500',
  'productivity': 'from-emerald-500 to-teal-500',
  'finance': 'from-amber-500 to-orange-500',
  'hr': 'from-indigo-500 to-purple-500',
  'sales': 'from-rose-500 to-pink-500',
  'marketing': 'from-fuchsia-500 to-pink-500',
  'operations': 'from-cyan-500 to-blue-500',
  'customer-support': 'from-green-500 to-emerald-500',
  'developer-tools': 'from-slate-500 to-gray-600',
  'social-media': 'from-sky-500 to-indigo-500',
}

// Convert service template to UI display format
interface UITemplate {
  id: string
  name: string
  description: string
  category: string
  apps: string[]
  uses: number
  rating: number
  timeSaved: string
  popular: boolean
  featured: boolean
  color: string
  requiredIntegrations: string[]
  regionRelevance?: string[]
}

function convertToUITemplate(template: WorkflowTemplate): UITemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    apps: template.requiredIntegrations.slice(0, 3).map(tool => TOOL_EMOJIS[tool.toLowerCase()] || '⚙️'),
    uses: 0, // Real usage tracking not yet implemented
    rating: 0, // Real rating system not yet implemented
    timeSaved: template.estimatedTimeSaved,
    popular: template.popularity >= 85,
    featured: template.popularity >= 90,
    color: CATEGORY_COLORS[template.category] || 'from-gray-500 to-gray-600',
    requiredIntegrations: template.requiredIntegrations,
    regionRelevance: template.regionRelevance,
  }
}

// Get all templates from service and convert to UI format
const templates: UITemplate[] = WorkflowTemplatesService.getAllTemplates().map(convertToUITemplate)

// Build category list from service
const serviceCategories = WorkflowTemplatesService.getCategories()
const categories = ['All', 'Popular', ...serviceCategories.filter(c => c.count > 0).map(c => c.name)]

export function WorkflowTemplates() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [likedTemplates, setLikedTemplates] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('global')

  // Use service methods for filtering with memoization
  const filteredTemplates = useMemo(() => {
    let result = templates

    // Apply search filter (uses service under the hood for smart search)
    if (searchQuery.trim()) {
      const searchResults = WorkflowTemplatesService.search(searchQuery)
      const searchIds = new Set(searchResults.map(t => t.id))
      result = result.filter(t => searchIds.has(t.id))
    }

    // Apply category filter
    if (selectedCategory !== 'All' && selectedCategory !== 'Popular') {
      // Map display name back to category ID
      const categoryMapping = serviceCategories.find(c => c.name === selectedCategory)
      if (categoryMapping) {
        result = result.filter(t => t.category === categoryMapping.id)
      }
    } else if (selectedCategory === 'Popular') {
      result = result.filter(t => t.popular)
    }

    // Apply region filter (uses RegionalIntelligenceService integration)
    if (selectedRegion !== 'global') {
      result = result.filter(t =>
        !t.regionRelevance ||
        t.regionRelevance.includes('global') ||
        t.regionRelevance.includes(selectedRegion)
      )
    }

    return result
  }, [searchQuery, selectedCategory, selectedRegion])

  const featuredTemplate = useMemo(() => templates.find(t => t.featured && t.popular), [])

  const toggleLike = (id: string) => {
    setLikedTemplates(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Region options for filtering
  const regions = [
    { id: 'global', name: 'All Regions', icon: '🌍' },
    { id: 'kuwait', name: 'Kuwait', icon: '🇰🇼' },
    { id: 'gcc', name: 'GCC', icon: '🏛️' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Templates</h1>
          <p className="text-sm sm:text-base text-surface-400 mt-1">Start with pre-built workflows and customize to your needs</p>
        </div>
      </div>

      {/* Featured template */}
      {featuredTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-nexus-500/20 via-accent-500/20 to-orange-500/20 border border-nexus-500/30 p-4 sm:p-8"
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                <span className="badge-primary flex items-center gap-1 text-xs sm:text-sm">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
                <span className="badge flex items-center gap-1 text-xs sm:text-sm">
                  <TrendingUp className="w-3 h-3" />
                  Most Popular
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                {featuredTemplate.name}
              </h2>
              <p className="text-sm sm:text-base text-surface-300 mb-4 sm:mb-6 max-w-xl">
                {featuredTemplate.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-4 sm:mb-6">
                {featuredTemplate.uses > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-400" />
                    <span className="text-xs sm:text-sm text-surface-300">{featuredTemplate.uses.toLocaleString()} uses</span>
                  </div>
                )}
                {featuredTemplate.rating > 0 ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-current" />
                    <span className="text-xs sm:text-sm text-surface-300">{featuredTemplate.rating}</span>
                  </div>
                ) : (
                  <span className="badge text-xs bg-nexus-500/20 text-nexus-300">New Template</span>
                )}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-400" />
                  <span className="text-xs sm:text-sm text-surface-300">Saves {featuredTemplate.timeSaved}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-gradient text-sm sm:text-base"
              >
                Use This Template
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline" />
              </motion.button>
            </div>

            {/* Apps preview */}
            <div className="flex items-center gap-2 sm:gap-4">
              {featuredTemplate.apps.map((app, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface-800/80 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl shadow-lg"
                >
                  {app}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="input pl-12"
            />
          </div>
          {/* Region filter dropdown */}
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="btn-secondary flex items-center gap-2 py-3 pr-8 appearance-none cursor-pointer bg-surface-800 border-surface-600"
            >
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.icon} {region.name}
                </option>
              ))}
            </select>
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>
          <button className="btn-secondary flex items-center gap-2 py-3">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                selectedCategory === category
                  ? 'bg-nexus-500 text-white'
                  : 'bg-surface-800 text-surface-300 hover:bg-surface-700 hover:text-white'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="card-glow group cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLike(template.id)
                }}
                className="p-2 rounded-lg hover:bg-surface-700 transition-all"
              >
                <Heart
                  className={clsx(
                    'w-5 h-5 transition-colors',
                    likedTemplates.includes(template.id)
                      ? 'text-red-500 fill-current'
                      : 'text-surface-400 hover:text-red-400'
                  )}
                />
              </button>
            </div>

            {/* Content */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-white group-hover:text-nexus-400 transition-colors">
                {template.name}
              </h3>
              {template.popular && (
                <Star className="w-4 h-4 text-amber-400 fill-current" />
              )}
            </div>
            <p className="text-sm text-surface-400 mb-4 line-clamp-2">
              {template.description}
            </p>

            {/* Apps */}
            <div className="flex items-center gap-2 mb-4">
              {template.apps.map((app, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-lg"
                >
                  {app}
                </div>
              ))}
              <ChevronRight className="w-4 h-4 text-surface-500" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm mb-4">
              {template.uses > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-surface-500" />
                  <span className="text-surface-400">{(template.uses / 1000).toFixed(1)}k</span>
                </div>
              )}
              {template.rating > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-surface-400">{template.rating}</span>
                </div>
              ) : (
                <span className="badge text-xs bg-nexus-500/20 text-nexus-300">New</span>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-surface-500" />
                <span className="text-surface-400">{template.timeSaved}</span>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-4 border-t border-surface-700/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-secondary py-2.5 text-sm flex items-center justify-center gap-2 group-hover:bg-nexus-500 group-hover:border-nexus-500 group-hover:text-white transition-all"
              >
                <Copy className="w-4 h-4" />
                Use Template
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
          <p className="text-surface-400 mb-6">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
            }}
            className="btn-secondary"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

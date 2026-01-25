/**
 * IntegrationConnectStep Component
 *
 * Integration quick connect component for the onboarding flow.
 * Allows users to easily connect their most-used apps with one-click OAuth flows.
 *
 * Features:
 * - Category tabs for filtering (Communication, CRM, E-commerce, etc.)
 * - Search/filter functionality
 * - Popular and Recommended badges
 * - Personalized recommendations based on industry/business size
 * - "Works great together" app bundles
 * - One-click connect with loading states
 *
 * TypeScript Guidelines:
 * - NO enums (uses const objects with type aliases)
 * - NO parameter properties in constructors
 * - Uses `import type` for type-only imports
 * - Unused params prefixed with underscore
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Search,
  ChevronRight,
  Sparkles,
  Package,
  Check,
  X,
  MessageSquare,
  Users,
  ShoppingBag,
  Layers,
  Megaphone,
  CreditCard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  IntegrationCard,
  CONNECTION_STATUS,
} from './IntegrationCard'
import type { ConnectionState } from './IntegrationCard'
import {
  INTEGRATION_CATEGORIES,
  CATEGORY_INFO,
  INTEGRATIONS,
  getRecommendedForIndustry,
  getBundlesForIndustry,
  getIntegrationsByIds,
  searchIntegrations,
  mapBusinessTypeToIndustry,
} from './integration-catalog'
import type {
  Integration,
  IntegrationCategory,
  IntegrationBundle,
  Industry,
} from './integration-catalog'

// ============================================================================
// Tab Category Icons
// ============================================================================

const CATEGORY_ICONS: Record<IntegrationCategory | 'all', LucideIcon> = {
  all: Layers,
  [INTEGRATION_CATEGORIES.COMMUNICATION]: MessageSquare,
  [INTEGRATION_CATEGORIES.CRM]: Users,
  [INTEGRATION_CATEGORIES.ECOMMERCE]: ShoppingBag,
  [INTEGRATION_CATEGORIES.PRODUCTIVITY]: Layers,
  [INTEGRATION_CATEGORIES.MARKETING]: Megaphone,
  [INTEGRATION_CATEGORIES.PAYMENT]: CreditCard,
}

// ============================================================================
// Component Props
// ============================================================================

export interface IntegrationConnectStepProps {
  /** Business type selected in previous step (e.g., 'ecommerce', 'saas') */
  businessType?: string | null
  /** Business size (optional, for personalized recommendations) */
  businessSize?: string | null
  /** Already connected integration IDs */
  connectedIntegrations?: string[]
  /** Callback when connections are complete */
  onComplete: (connectedIds: string[]) => void
  /** Callback when user skips */
  onSkip: () => void
  /** Callback when integration is connected */
  onConnect?: (integrationId: string) => void
}

// ============================================================================
// Category Tab Component
// ============================================================================

interface CategoryTabProps {
  category: IntegrationCategory | 'all'
  label: string
  isSelected: boolean
  count: number
  onClick: () => void
}

function CategoryTab({ category, label, isSelected, count, onClick }: CategoryTabProps) {
  const Icon = CATEGORY_ICONS[category]

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
        isSelected
          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      )}
      role="tab"
      aria-selected={isSelected}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      <span
        className={cn(
          'text-xs px-1.5 py-0.5 rounded-full',
          isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
        )}
      >
        {count}
      </span>
    </button>
  )
}

// ============================================================================
// Bundle Card Component
// ============================================================================

interface BundleCardProps {
  bundle: IntegrationBundle
  integrations: Integration[]
  connectedIds: Set<string>
  onConnectBundle: (bundle: IntegrationBundle) => void
}

function BundleCard({ bundle, integrations, connectedIds, onConnectBundle }: BundleCardProps) {
  const allConnected = bundle.integrationIds.every((id) => connectedIds.has(id))
  const someConnected = bundle.integrationIds.some((id) => connectedIds.has(id))
  const connectedCount = bundle.integrationIds.filter((id) => connectedIds.has(id)).length

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'p-4 rounded-xl border transition-all',
        allConnected
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            <h4 className="font-semibold text-white text-sm">{bundle.name}</h4>
          </div>
          <p className="text-xs text-slate-400 mt-1">{bundle.description}</p>
        </div>
        {allConnected && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
            <Check className="w-2.5 h-2.5 mr-1" />
            All Connected
          </Badge>
        )}
      </div>

      {/* Integration Icons */}
      <div className="flex items-center gap-2 mb-3">
        {integrations.map((integration) => {
          const isConnected = connectedIds.has(integration.id)
          return (
            <div
              key={integration.id}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs relative',
                `bg-gradient-to-br ${integration.iconBgGradient}`,
                !isConnected && 'opacity-50'
              )}
              title={integration.name}
            >
              {integration.name.charAt(0)}
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Connect Button */}
      {!allConnected && (
        <Button
          onClick={() => onConnectBundle(bundle)}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          {someConnected
            ? `Connect ${bundle.integrationIds.length - connectedCount} more`
            : 'Connect All'}
        </Button>
      )}
    </motion.div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function IntegrationConnectStep({
  businessType,
  businessSize: _businessSize,
  connectedIntegrations = [],
  onComplete,
  onSkip,
  onConnect,
}: IntegrationConnectStepProps) {
  // Void unused params per TypeScript guidelines
  void _businessSize

  const { t } = useTranslation()

  // State
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [connectedIds, setConnectedIds] = useState<Set<string>>(
    new Set(connectedIntegrations)
  )
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({})

  // Determine industry from business type
  const industry: Industry | null = useMemo(() => {
    if (!businessType) return null
    return mapBusinessTypeToIndustry(businessType)
  }, [businessType])

  // Get recommended integrations for the industry
  const recommendedIntegrations = useMemo(() => {
    if (!industry) return []
    return getRecommendedForIndustry(industry)
  }, [industry])

  // Get bundles for the industry
  const industryBundles = useMemo(() => {
    if (!industry) return []
    return getBundlesForIndustry(industry)
  }, [industry])

  // Filter integrations based on category and search
  const filteredIntegrations = useMemo(() => {
    let results = searchQuery ? searchIntegrations(searchQuery) : INTEGRATIONS

    if (selectedCategory !== 'all') {
      results = results.filter((i) => i.category === selectedCategory)
    }

    // Sort: connected first, then recommended, then popular, then rest
    return results.sort((a, b) => {
      const aConnected = connectedIds.has(a.id)
      const bConnected = connectedIds.has(b.id)
      const aRecommended = recommendedIntegrations.some((r) => r.id === a.id)
      const bRecommended = recommendedIntegrations.some((r) => r.id === b.id)

      if (aConnected && !bConnected) return -1
      if (!aConnected && bConnected) return 1
      if (aRecommended && !bRecommended) return -1
      if (!aRecommended && bRecommended) return 1
      if (a.isPopular && !b.isPopular) return -1
      if (!a.isPopular && b.isPopular) return 1
      return 0
    })
  }, [selectedCategory, searchQuery, connectedIds, recommendedIntegrations])

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<IntegrationCategory | 'all', number> = {
      all: INTEGRATIONS.length,
      [INTEGRATION_CATEGORIES.COMMUNICATION]: 0,
      [INTEGRATION_CATEGORIES.CRM]: 0,
      [INTEGRATION_CATEGORIES.ECOMMERCE]: 0,
      [INTEGRATION_CATEGORIES.PRODUCTIVITY]: 0,
      [INTEGRATION_CATEGORIES.MARKETING]: 0,
      [INTEGRATION_CATEGORIES.PAYMENT]: 0,
    }

    INTEGRATIONS.forEach((integration) => {
      counts[integration.category]++
    })

    return counts
  }, [])

  // Simulate OAuth connection
  const simulateOAuthConnection = useCallback(
    async (integrationId: string): Promise<boolean> => {
      // Set connecting state
      setConnectionStates((prev) => ({
        ...prev,
        [integrationId]: { status: CONNECTION_STATUS.CONNECTING },
      }))

      // Simulate OAuth flow (1.5-2.5 seconds)
      const delay = 1500 + Math.random() * 1000

      return new Promise((resolve) => {
        setTimeout(() => {
          // 95% success rate for demo
          const success = Math.random() > 0.05

          if (success) {
            setConnectedIds((prev) => new Set([...prev, integrationId]))
            setConnectionStates((prev) => ({
              ...prev,
              [integrationId]: { status: CONNECTION_STATUS.CONNECTED },
            }))
            onConnect?.(integrationId)
            resolve(true)
          } else {
            setConnectionStates((prev) => ({
              ...prev,
              [integrationId]: {
                status: CONNECTION_STATUS.ERROR,
                error: 'Connection failed. Please try again.',
              },
            }))
            resolve(false)
          }
        }, delay)
      })
    },
    [onConnect]
  )

  // Handle connect
  const handleConnect = useCallback(
    (integrationId: string) => {
      simulateOAuthConnection(integrationId)
    },
    [simulateOAuthConnection]
  )

  // Handle disconnect
  const handleDisconnect = useCallback((integrationId: string) => {
    setConnectedIds((prev) => {
      const next = new Set(prev)
      next.delete(integrationId)
      return next
    })
    setConnectionStates((prev) => ({
      ...prev,
      [integrationId]: { status: CONNECTION_STATUS.IDLE },
    }))
  }, [])

  // Handle bundle connect
  const handleConnectBundle = useCallback(
    async (bundle: IntegrationBundle) => {
      const unconnectedIds = bundle.integrationIds.filter((id) => !connectedIds.has(id))

      // Connect all unconnected integrations in parallel
      await Promise.all(unconnectedIds.map((id) => simulateOAuthConnection(id)))
    },
    [connectedIds, simulateOAuthConnection]
  )

  // Handle complete
  const handleComplete = useCallback(() => {
    onComplete(Array.from(connectedIds))
  }, [connectedIds, onComplete])

  // Get connection state for an integration
  const getConnectionState = useCallback(
    (integrationId: string): ConnectionState => {
      if (connectedIds.has(integrationId) && !connectionStates[integrationId]) {
        return { status: CONNECTION_STATUS.CONNECTED }
      }
      return connectionStates[integrationId] || { status: CONNECTION_STATUS.IDLE }
    },
    [connectedIds, connectionStates]
  )

  // Check if integration is recommended
  const isRecommended = useCallback(
    (integrationId: string): boolean => {
      return recommendedIntegrations.some((i) => i.id === integrationId)
    },
    [recommendedIntegrations]
  )

  const hasConnections = connectedIds.size > 0

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {t('onboarding.integrationConnect.title', 'Connect Your Apps')}
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          {t(
            'onboarding.integrationConnect.subtitle',
            'Connect the tools you use every day. One click to authorize.'
          )}
        </p>
      </motion.div>

      {/* Connected Count Badge */}
      <AnimatePresence>
        {hasConnections && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex justify-center mb-4"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                {connectedIds.size} app{connectedIds.size !== 1 ? 's' : ''} connected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommended Bundles (if industry detected) */}
      {industry && industryBundles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Works Great Together</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {industryBundles.slice(0, 2).map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                integrations={getIntegrationsByIds(bundle.integrationIds)}
                connectedIds={connectedIds}
                onConnectBundle={handleConnectBundle}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder={t('onboarding.integrationConnect.searchPlaceholder', 'Search apps...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          role="tablist"
          aria-label="Integration categories"
        >
          <CategoryTab
            category="all"
            label="All"
            isSelected={selectedCategory === 'all'}
            count={categoryCounts.all}
            onClick={() => setSelectedCategory('all')}
          />
          {CATEGORY_INFO.map((category) => (
            <CategoryTab
              key={category.id}
              category={category.id}
              label={category.label}
              isSelected={selectedCategory === category.id}
              count={categoryCounts[category.id]}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Integration Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6"
      >
        {filteredIntegrations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400">
              {searchQuery
                ? t('onboarding.integrationConnect.noResults', 'No apps found matching your search')
                : t('onboarding.integrationConnect.noApps', 'No apps in this category')}
            </p>
          </div>
        ) : (
          filteredIntegrations.map((integration, index) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              connectionState={getConnectionState(integration.id)}
              isRecommended={isRecommended(integration.id)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              animationDelay={index * 0.03}
              compact
            />
          ))
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button
          onClick={handleComplete}
          variant="cta"
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          {hasConnections
            ? t('common.continue', 'Continue')
            : t('onboarding.integrationConnect.continueWithout', 'Continue Without Apps')}
        </Button>

        {!hasConnections && (
          <Button
            onClick={onSkip}
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto text-slate-400 hover:text-white"
          >
            {t('common.skipForNow', 'Skip for now')}
          </Button>
        )}
      </motion.div>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-slate-500 text-center mt-4"
      >
        {t(
          'onboarding.integrationConnect.helper',
          'You can always connect more apps later from Settings'
        )}
      </motion.p>
    </div>
  )
}

export default IntegrationConnectStep

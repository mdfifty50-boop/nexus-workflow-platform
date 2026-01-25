import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Check,
  Settings,
  RefreshCw,
  Star,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import clsx from 'clsx'

// @NEXUS-FIX-046: Real integration connection status - DO NOT REMOVE
// This fix replaces hardcoded connected:true/false with real API calls
// to /api/rube/connection-status/:toolkit

const categories = ['All', 'Popular', 'Communication', 'CRM', 'Storage', 'Analytics', 'Social', 'Payments']

// Static integration metadata - connection status is fetched from API
const INTEGRATION_METADATA = [
  {
    id: 1,
    name: 'Gmail',
    toolkit: 'gmail', // API toolkit name (lowercase)
    description: 'Read and send emails, manage labels and attachments',
    category: 'Communication',
    icon: '📧',
    popular: true,
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 2,
    name: 'Slack',
    toolkit: 'slack',
    description: 'Send messages, create channels, manage notifications',
    category: 'Communication',
    icon: '💬',
    popular: true,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    name: 'Google Drive',
    toolkit: 'googledrive',
    description: 'Store, share, and sync files across your organization',
    category: 'Storage',
    icon: '📁',
    popular: true,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 4,
    name: 'HubSpot',
    toolkit: 'hubspot',
    description: 'Manage contacts, deals, and marketing campaigns',
    category: 'CRM',
    icon: '🎯',
    popular: true,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 5,
    name: 'Notion',
    toolkit: 'notion',
    description: 'Create and manage databases, pages, and wikis',
    category: 'Storage',
    icon: '📝',
    popular: true,
    color: 'from-gray-600 to-gray-800',
  },
  {
    id: 6,
    name: 'Stripe',
    toolkit: 'stripe',
    description: 'Process payments and manage subscriptions',
    category: 'Payments',
    icon: '💳',
    popular: true,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 7,
    name: 'Salesforce',
    toolkit: 'salesforce',
    description: 'Enterprise CRM for sales, service, and marketing',
    category: 'CRM',
    icon: '☁️',
    popular: false,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 8,
    name: 'Twitter',
    toolkit: 'twitter',
    description: 'Post tweets, monitor mentions, manage DMs',
    category: 'Social',
    icon: '🐦',
    popular: false,
    color: 'from-blue-400 to-blue-500',
  },
  {
    id: 9,
    name: 'Google Analytics',
    toolkit: 'googleanalytics',
    description: 'Track website traffic and user behavior',
    category: 'Analytics',
    icon: '📊',
    popular: false,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 10,
    name: 'Dropbox',
    toolkit: 'dropbox',
    description: 'Cloud storage and file synchronization',
    category: 'Storage',
    icon: '📦',
    popular: false,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 11,
    name: 'Discord',
    toolkit: 'discord',
    description: 'Send messages and manage community servers',
    category: 'Communication',
    icon: '🎮',
    popular: false,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 12,
    name: 'WhatsApp',
    toolkit: 'whatsapp',
    description: 'Business messaging and customer communication',
    category: 'Communication',
    icon: '💚',
    popular: true,
    color: 'from-green-500 to-emerald-500',
  },
]

interface IntegrationWithStatus {
  id: number
  name: string
  toolkit: string
  description: string
  category: string
  icon: string
  popular: boolean
  color: string
  connected: boolean
  loading: boolean
  error?: string
  workflows: number
}

export function Integrations() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [integrations, setIntegrations] = useState<IntegrationWithStatus[]>(() =>
    // Initialize with loading state for all integrations
    INTEGRATION_METADATA.map(meta => ({
      ...meta,
      connected: false,
      loading: true,
      workflows: 0,
    }))
  )
  const [isRefreshing, setIsRefreshing] = useState(false)

  // @NEXUS-FIX-046: Fetch REAL connection status from API
  const fetchConnectionStatus = useCallback(async (toolkit: string): Promise<{ connected: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/rube/connection-status/${toolkit}`)
      if (!response.ok) {
        // API returned error, treat as not connected
        console.warn(`[Integrations] Connection check failed for ${toolkit}: ${response.status}`)
        return { connected: false, error: `API error: ${response.status}` }
      }
      const data = await response.json()
      // The API returns { success: true, connection: { toolkit, connected, ... } }
      // OR { success: true, connected: boolean } depending on the endpoint
      const connected = data.connection?.connected ?? data.connected ?? false
      return { connected }
    } catch (error) {
      console.error(`[Integrations] Failed to fetch connection status for ${toolkit}:`, error)
      return { connected: false, error: 'Network error' }
    }
  }, [])

  // Fetch all connection statuses on mount
  useEffect(() => {
    const fetchAllStatuses = async () => {
      console.log('[Integrations] Fetching REAL connection status for all integrations...')

      // Fetch all statuses in parallel
      const statusPromises = INTEGRATION_METADATA.map(async (meta) => {
        const status = await fetchConnectionStatus(meta.toolkit)
        return {
          toolkit: meta.toolkit,
          ...status,
        }
      })

      const statuses = await Promise.all(statusPromises)

      // Update state with real connection statuses
      setIntegrations(prev => prev.map(integration => {
        const status = statuses.find(s => s.toolkit === integration.toolkit)
        return {
          ...integration,
          connected: status?.connected ?? false,
          loading: false,
          error: status?.error,
          // TODO: Fetch actual workflow count from backend
          workflows: status?.connected ? 0 : 0,
        }
      }))

      const connectedNames = statuses.filter(s => s.connected).map(s => s.toolkit)
      console.log(`[Integrations] Connection check complete. Connected: ${connectedNames.length > 0 ? connectedNames.join(', ') : 'none'}`)
    }

    fetchAllStatuses()
  }, [fetchConnectionStatus])

  // Refresh all connections
  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    setIntegrations(prev => prev.map(i => ({ ...i, loading: true })))

    const statusPromises = INTEGRATION_METADATA.map(async (meta) => {
      const status = await fetchConnectionStatus(meta.toolkit)
      return { toolkit: meta.toolkit, ...status }
    })

    const statuses = await Promise.all(statusPromises)

    setIntegrations(prev => prev.map(integration => {
      const status = statuses.find(s => s.toolkit === integration.toolkit)
      return {
        ...integration,
        connected: status?.connected ?? false,
        loading: false,
        error: status?.error,
      }
    }))

    setIsRefreshing(false)
  }

  // Handle connect button click - initiate OAuth
  const handleConnect = async (toolkit: string) => {
    try {
      // Update loading state for this integration
      setIntegrations(prev => prev.map(i =>
        i.toolkit === toolkit ? { ...i, loading: true } : i
      ))

      // @NEXUS-FIX-073: Use correct endpoint /api/rube/manage-connections
      // Sends toolkits as array, returns { success, results: { [toolkit]: { redirect_url } } }
      const response = await fetch('/api/rube/manage-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkits: [toolkit] }),
      })

      if (!response.ok) {
        throw new Error(`Failed to initiate connection: ${response.status}`)
      }

      const data = await response.json()
      const toolkitResult = data.results?.[toolkit]

      if (toolkitResult?.redirect_url) {
        // Open OAuth popup
        const popup = window.open(toolkitResult.redirect_url, `connect-${toolkit}`, 'width=600,height=700')

        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const status = await fetchConnectionStatus(toolkit)
          if (status.connected) {
            clearInterval(pollInterval)
            setIntegrations(prev => prev.map(i =>
              i.toolkit === toolkit ? { ...i, connected: true, loading: false } : i
            ))
            if (popup && !popup.closed) {
              popup.close()
            }
          }
        }, 3000)

        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          setIntegrations(prev => prev.map(i =>
            i.toolkit === toolkit ? { ...i, loading: false } : i
          ))
        }, 120000)
      }
    } catch (error) {
      console.error(`[Integrations] Failed to connect ${toolkit}:`, error)
      setIntegrations(prev => prev.map(i =>
        i.toolkit === toolkit ? { ...i, loading: false, error: 'Connection failed' } : i
      ))
    }
  }

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' ||
      (selectedCategory === 'Popular' && integration.popular) ||
      integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const connectedCount = integrations.filter(i => i.connected).length
  const loadingCount = integrations.filter(i => i.loading).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Integrations</h1>
          <p className="text-sm sm:text-base text-surface-400 mt-1">
            {loadingCount > 0 ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking connection status...
              </span>
            ) : (
              `${connectedCount} of ${integrations.length} apps connected`
            )}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Request Integration
        </motion.button>
      </div>

      {/* Connected summary - @NEXUS-FIX-046: Real connection status */}
      <div className="card bg-gradient-to-r from-nexus-500/10 to-accent-500/10 border-nexus-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center">
              {loadingCount > 0 ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
              ) : (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">Connected Apps</h3>
              <p className="text-xs sm:text-sm text-surface-400">
                {loadingCount > 0
                  ? `Checking ${loadingCount} connection${loadingCount !== 1 ? 's' : ''}...`
                  : `Your workflows are using ${connectedCount} integration${connectedCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefreshAll}
              disabled={isRefreshing || loadingCount > 0}
              className={clsx(
                'p-2 rounded-lg transition-all',
                isRefreshing || loadingCount > 0
                  ? 'bg-surface-700 text-surface-500 cursor-not-allowed'
                  : 'bg-surface-700 text-surface-300 hover:bg-surface-600 hover:text-white'
              )}
              title="Refresh all connection statuses"
            >
              <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
            </motion.button>
            <div className="flex items-center -space-x-2">
              {integrations.filter(i => i.connected).slice(0, 5).map((integration, index) => (
                <div
                  key={integration.id}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-800 border-2 border-surface-900 flex items-center justify-center text-sm sm:text-lg"
                  style={{ zIndex: 5 - index }}
                >
                  {integration.icon}
                </div>
              ))}
              {connectedCount > 5 && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-700 border-2 border-surface-900 flex items-center justify-center text-[10px] sm:text-xs text-white font-medium">
                  +{connectedCount - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations..."
              className="input pl-12"
            />
          </div>
          <div className="flex items-center rounded-xl bg-surface-800 border border-surface-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-surface-700 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-surface-700 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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
              {category === 'Popular' && <Star className="w-3 h-3 ml-1.5 inline" />}
            </button>
          ))}
        </div>
      </div>

      {/* Integration grid */}
      <div className={clsx(
        'grid gap-6',
        viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      )}>
        {filteredIntegrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className={clsx(
              'card-glow group cursor-pointer',
              viewMode === 'list' && 'flex items-center gap-6'
            )}
          >
            {/* Icon and status */}
            <div className={clsx(
              'flex items-start justify-between',
              viewMode === 'list' && 'flex-shrink-0'
            )}>
              <div className={clsx(
                'rounded-lg sm:rounded-xl flex items-center justify-center text-2xl sm:text-3xl',
                viewMode === 'grid' ? 'w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4' : 'w-10 h-10 sm:w-12 sm:h-12',
                `bg-gradient-to-br ${integration.color} bg-opacity-20`
              )}>
                {integration.icon}
              </div>
              {viewMode === 'grid' && (
                <div className="flex items-center gap-2">
                  {integration.popular && (
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                  )}
                  {integration.loading ? (
                    <Loader2 className="w-3 h-3 text-surface-400 animate-spin" />
                  ) : integration.connected ? (
                    <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface-900" />
                  ) : null}
                </div>
              )}
            </div>

            {/* Content */}
            <div className={clsx('flex-1', viewMode === 'list' && 'min-w-0')}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white group-hover:text-nexus-400 transition-colors">
                  {integration.name}
                </h3>
                {viewMode === 'list' && integration.popular && (
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                )}
              </div>
              <p className={clsx(
                'text-xs sm:text-sm text-surface-400',
                viewMode === 'grid' ? 'mb-3 sm:mb-4' : 'truncate'
              )}>
                {integration.description}
              </p>

              {viewMode === 'grid' && (
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <span className="text-surface-500">
                    {integration.category}
                  </span>
                  {integration.connected && (
                    <>
                      <span className="text-surface-600">•</span>
                      <span className="text-surface-400">
                        {integration.workflows} workflow{integration.workflows !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action button - @NEXUS-FIX-046: Real connection handling */}
            <div className={clsx(
              viewMode === 'grid' ? 'mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-surface-700/50' : 'flex-shrink-0'
            )}>
              {integration.loading ? (
                <div className="flex items-center justify-center gap-2 py-2.5 text-surface-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Checking...</span>
                </div>
              ) : integration.error ? (
                <div className={clsx(
                  'flex items-center gap-2',
                  viewMode === 'grid' && 'justify-between'
                )}>
                  <span className="badge bg-amber-500/20 text-amber-400 text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Check failed
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleConnect(integration.toolkit)}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    Retry
                  </motion.button>
                </div>
              ) : integration.connected ? (
                <div className={clsx(
                  'flex items-center gap-2',
                  viewMode === 'grid' && 'justify-between'
                )}>
                  <span className="badge-success">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIntegrations(prev => prev.map(i =>
                          i.toolkit === integration.toolkit ? { ...i, loading: true } : i
                        ))
                        fetchConnectionStatus(integration.toolkit).then(status => {
                          setIntegrations(prev => prev.map(i =>
                            i.toolkit === integration.toolkit ? { ...i, connected: status.connected, loading: false } : i
                          ))
                        })
                      }}
                      className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConnect(integration.toolkit)}
                  className={clsx(
                    'btn-primary py-2.5 text-sm flex items-center justify-center gap-2',
                    viewMode === 'grid' ? 'w-full' : 'px-6'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Connect
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredIntegrations.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No integrations found</h3>
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

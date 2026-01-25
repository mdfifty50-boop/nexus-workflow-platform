import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'

// Integration provider interface
interface IntegrationProvider {
  id: string
  name: string
  category: 'crm' | 'email' | 'calendar' | 'storage' | 'communication'
  icon: string
  color: string
  authType: 'oauth2' | 'api_key' | 'basic'
}

// Connected integration interface
interface ConnectedIntegration {
  id: string
  provider: string
  provider_info: IntegrationProvider
  health_status: 'healthy' | 'warning' | 'error' | 'unknown'
  last_health_check: string | null
  usage_count: number
  last_used_at: string | null
  created_at: string
}

interface IntegrationManagerProps {
  projectId: string
  onIntegrationChange?: () => void
}

// Category labels and icons
const CATEGORY_INFO: Record<string, { label: string; icon: string }> = {
  crm: { label: 'CRM', icon: '👥' },
  email: { label: 'Email', icon: '📧' },
  calendar: { label: 'Calendar', icon: '📅' },
  storage: { label: 'Storage', icon: '📁' },
  communication: { label: 'Communication', icon: '💬' },
}

// Health status colors
const HEALTH_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  warning: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  unknown: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500' },
}

export function IntegrationManager({ projectId, onIntegrationChange }: IntegrationManagerProps) {
  const { userId } = useAuth()
  const [providers, setProviders] = useState<IntegrationProvider[]>([])
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Fetch available providers and connected integrations
  const fetchData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch providers
      const providersRes = await fetch('/api/integrations/providers')
      const providersData = await providersRes.json()
      if (providersData.success) {
        setProviders(providersData.data)
      }

      // Fetch connected integrations
      const integrationsRes = await fetch(`/api/integrations/project/${projectId}`, {
        headers: { 'X-Clerk-User-Id': userId },
      })
      const integrationsData = await integrationsRes.json()
      if (integrationsData.success) {
        setConnectedIntegrations(integrationsData.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Start OAuth connection flow
  const handleConnect = async (providerId: string) => {
    if (!userId) return

    setConnecting(providerId)
    setError(null)

    try {
      const redirectUri = `${window.location.origin}/integrations/callback`
      const response = await fetch(
        `/api/integrations/oauth/authorize/${providerId}?projectId=${projectId}&redirectUri=${encodeURIComponent(redirectUri)}`,
        { headers: { 'X-Clerk-User-Id': userId } }
      )

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Store state in sessionStorage for callback verification
      sessionStorage.setItem('oauth_state', data.data.state)

      // Redirect to OAuth provider
      window.location.href = data.data.url
    } catch (err: any) {
      setError(err.message)
      setConnecting(null)
    }
  }

  // Disconnect integration
  const handleDisconnect = async (providerId: string) => {
    if (!userId) return
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    try {
      const response = await fetch(`/api/integrations/${projectId}/${providerId}`, {
        method: 'DELETE',
        headers: { 'X-Clerk-User-Id': userId },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      await fetchData()
      onIntegrationChange?.()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Check health of an integration
  const handleCheckHealth = async (credentialId: string) => {
    try {
      const response = await fetch(`/api/integrations/health/${credentialId}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        await fetchData()
      }
    } catch (err: any) {
      console.error('Health check failed:', err)
    }
  }

  // Reconnect integration (refresh token)
  const handleReconnect = async (credentialId: string) => {
    try {
      const response = await fetch(`/api/integrations/oauth/reconnect/${credentialId}`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': userId || '' },
      })

      const data = await response.json()

      if (data.success) {
        await fetchData()
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Get unique categories from providers
  const categories = [...new Set(providers.map((p) => p.category))]

  // Filter providers by category
  const filteredProviders = selectedCategory
    ? providers.filter((p) => p.category === selectedCategory)
    : providers

  // Check if provider is connected
  const isConnected = (providerId: string) => {
    return connectedIntegrations.some((i) => i.provider === providerId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect your tools and services to automate workflows
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {connectedIntegrations.length} connected
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          All ({providers.length})
        </button>
        {categories.map((category) => {
          const info = CATEGORY_INFO[category] || { label: category, icon: '📦' }
          const count = providers.filter((p) => p.category === category).length
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <span>{info.icon}</span>
              {info.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Connected</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {connectedIntegrations.map((integration) => {
              const provider = integration.provider_info
              const health = HEALTH_COLORS[integration.health_status] || HEALTH_COLORS.unknown

              return (
                <div
                  key={integration.id}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${provider?.color}20` }}
                      >
                        {provider?.icon || '🔌'}
                      </div>
                      <div>
                        <p className="font-medium">{provider?.name || integration.provider}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${health.dot}`} />
                          <span className={`text-xs ${health.text}`}>
                            {integration.health_status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {integration.health_status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReconnect(integration.id)}
                          className="text-xs"
                        >
                          Reconnect
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCheckHealth(integration.id)}
                        title="Check health"
                      >
                        🔄
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisconnect(integration.provider)}
                        className="text-red-600 hover:text-red-700"
                        title="Disconnect"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    <span>Used {integration.usage_count || 0} times</span>
                    {integration.last_used_at && (
                      <span className="ml-2">
                        · Last: {new Date(integration.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">Available</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProviders
            .filter((p) => !isConnected(p.id))
            .map((provider) => (
              <div
                key={provider.id}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${provider.color}20` }}
                  >
                    {provider.icon}
                  </div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {CATEGORY_INFO[provider.category]?.label || provider.category}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleConnect(provider.id)}
                  disabled={connecting === provider.id}
                >
                  {connecting === provider.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No integrations available in this category
        </div>
      )}
    </div>
  )
}

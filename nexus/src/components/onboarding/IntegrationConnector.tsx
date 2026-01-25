/**
 * IntegrationConnector Component
 *
 * A comprehensive integration connection flow component for onboarding.
 * Displays available integrations in a grid with connection status,
 * handles OAuth flow triggering, and provides visual feedback.
 *
 * Uses Rube MCP for actual OAuth authentication (placeholder integration).
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  ShoppingCart,
  Mail,
  MessageSquare,
  CreditCard,
  Cloud,
  Heart,
  Ticket,
  MessageCircle,
  FileText,
  Layout,
  Calendar,
  Database,
  Zap,
  Check,
  Loader2,
  Link,
  Star,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// ============================================================================
// Types
// ============================================================================

export interface IntegrationConnectorProps {
  /** IDs of integrations that must be connected to proceed */
  requiredIntegrations?: string[]
  /** IDs of integrations recommended for the user's workflow */
  recommendedIntegrations?: string[]
  /** Callback when user completes connection flow */
  onConnectionsComplete: (connected: string[]) => void
  /** Callback when user skips the integration step */
  onSkip: () => void
}

export interface IntegrationItem {
  id: string
  name: string
  icon: React.ReactNode
  iconBg: string
  description: string
  category: 'ecommerce' | 'communication' | 'productivity' | 'crm' | 'payment' | 'other'
  isConnected: boolean
  isRequired?: boolean
  isRecommended?: boolean
  isPopular?: boolean
}

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error'

interface ConnectionState {
  status: ConnectionStatus
  error?: string
}

// ============================================================================
// Integration Database
// ============================================================================

const integrationDatabase: Omit<IntegrationItem, 'isConnected' | 'isRequired' | 'isRecommended'>[] = [
  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    icon: <ShoppingBag className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-green-500 to-lime-400',
    description: 'Sync orders, products, and customers',
    category: 'ecommerce',
    isPopular: true,
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: <ShoppingCart className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-purple-600 to-indigo-500',
    description: 'WordPress e-commerce integration',
    category: 'ecommerce',
    isPopular: true,
  },
  // Communication
  {
    id: 'gmail',
    name: 'Gmail',
    icon: <Mail className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    description: 'Email automation and notifications',
    category: 'communication',
    isPopular: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: <MessageSquare className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    description: 'Team messaging and alerts',
    category: 'communication',
    isPopular: true,
  },
  {
    id: 'intercom',
    name: 'Intercom',
    icon: <MessageCircle className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    description: 'Customer chat and support',
    category: 'communication',
  },
  // CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: <Cloud className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    description: 'CRM and sales automation',
    category: 'crm',
    isPopular: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: <Heart className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
    description: 'Marketing and CRM platform',
    category: 'crm',
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    icon: <Ticket className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    description: 'Support ticket management',
    category: 'crm',
  },
  // Productivity
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    icon: <Database className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
    description: 'Spreadsheet data sync',
    category: 'productivity',
    isPopular: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: <FileText className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-slate-600 to-slate-800',
    description: 'Notes and documentation',
    category: 'productivity',
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: <Layout className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-blue-500 to-sky-400',
    description: 'Task and project boards',
    category: 'productivity',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: <Calendar className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    description: 'Calendar and scheduling',
    category: 'productivity',
  },
  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    icon: <CreditCard className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    description: 'Payment processing',
    category: 'payment',
    isPopular: true,
  },
  // Other
  {
    id: 'zapier',
    name: 'Zapier',
    icon: <Zap className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    description: 'Connect with 5000+ apps',
    category: 'other',
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simulates OAuth flow - in production, this would call Rube MCP
 * to handle actual OAuth authentication
 */
async function triggerOAuthFlow(_integrationId: string): Promise<{ success: boolean; error?: string }> {
  // Placeholder for Rube MCP integration
  // In production:
  // const result = await mcp__rube__RUBE_MANAGE_CONNECTIONS({
  //   toolkits: [_integrationId],
  // })

  return new Promise((resolve) => {
    // Simulate OAuth popup and callback
    const timeout = 1500 + Math.random() * 1000

    setTimeout(() => {
      // 90% success rate for demo
      const success = Math.random() > 0.1
      if (success) {
        resolve({ success: true })
      } else {
        resolve({ success: false, error: 'Connection was cancelled or failed. Please try again.' })
      }
    }, timeout)
  })
}

// ============================================================================
// Sub-components
// ============================================================================

interface IntegrationCardProps {
  integration: IntegrationItem
  connectionState: ConnectionState
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}

function IntegrationCard({
  integration,
  connectionState,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  const isConnecting = connectionState.status === 'connecting'
  const isConnected = integration.isConnected || connectionState.status === 'success'
  const hasError = connectionState.status === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`
          relative overflow-hidden transition-all duration-300 cursor-pointer group
          ${isConnected
            ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10'
            : hasError
              ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
          }
        `}
        onClick={() => {
          if (!isConnecting) {
            if (isConnected) {
              onDisconnect(integration.id)
            } else {
              onConnect(integration.id)
            }
          }
        }}
      >
        <CardContent className="p-4">
          {/* Badges */}
          <div className="absolute top-2 right-2 flex gap-1">
            {integration.isRequired && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5">
                Required
              </Badge>
            )}
            {integration.isRecommended && !integration.isRequired && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5">
                Recommended
              </Badge>
            )}
            {integration.isPopular && !integration.isRequired && !integration.isRecommended && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5">
                <Star className="w-2.5 h-2.5 mr-0.5" />
                Popular
              </Badge>
            )}
          </div>

          {/* Connection Status Indicator */}
          <AnimatePresence mode="wait">
            {isConnected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0
                ${integration.iconBg}
                ${isConnecting ? 'animate-pulse' : ''}
              `}
            >
              {isConnecting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                integration.icon
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {integration.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                {integration.description}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {hasError && connectionState.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{connectionState.error}</p>
              </div>
            </motion.div>
          )}

          {/* Hover Overlay */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center rounded-lg
              transition-opacity duration-200
              ${isConnected || hasError ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
              bg-slate-900/80
            `}
          >
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Link className="w-4 h-4" />
              <span>Connect</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function IntegrationConnector({
  requiredIntegrations = [],
  recommendedIntegrations = [],
  onConnectionsComplete,
  onSkip,
}: IntegrationConnectorProps) {
  // Track connected integrations
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set())

  // Track connection state per integration
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({})

  // Build the integration list with flags
  const integrations: IntegrationItem[] = integrationDatabase.map((integration) => ({
    ...integration,
    isConnected: connectedIds.has(integration.id),
    isRequired: requiredIntegrations.includes(integration.id),
    isRecommended: recommendedIntegrations.includes(integration.id),
  }))

  // Sort integrations: required first, then recommended, then popular, then rest
  const sortedIntegrations = [...integrations].sort((a, b) => {
    if (a.isRequired && !b.isRequired) return -1
    if (!a.isRequired && b.isRequired) return 1
    if (a.isRecommended && !b.isRecommended) return -1
    if (!a.isRecommended && b.isRecommended) return 1
    if (a.isPopular && !b.isPopular) return -1
    if (!a.isPopular && b.isPopular) return 1
    return 0
  })

  // Check if all required integrations are connected
  const allRequiredConnected = requiredIntegrations.every((id) => connectedIds.has(id))
  const hasAnyConnections = connectedIds.size > 0

  // Handle connect
  const handleConnect = useCallback(async (integrationId: string) => {
    // Set connecting state
    setConnectionStates((prev) => ({
      ...prev,
      [integrationId]: { status: 'connecting' },
    }))

    // Trigger OAuth flow
    const result = await triggerOAuthFlow(integrationId)

    if (result.success) {
      // Update connected state
      setConnectedIds((prev) => new Set([...prev, integrationId]))
      setConnectionStates((prev) => ({
        ...prev,
        [integrationId]: { status: 'success' },
      }))
    } else {
      // Set error state
      setConnectionStates((prev) => ({
        ...prev,
        [integrationId]: { status: 'error', error: result.error },
      }))
    }
  }, [])

  // Handle disconnect
  const handleDisconnect = useCallback((integrationId: string) => {
    setConnectedIds((prev) => {
      const next = new Set(prev)
      next.delete(integrationId)
      return next
    })
    setConnectionStates((prev) => ({
      ...prev,
      [integrationId]: { status: 'idle' },
    }))
  }, [])

  // Handle complete
  const handleComplete = useCallback(() => {
    onConnectionsComplete(Array.from(connectedIds))
  }, [connectedIds, onConnectionsComplete])

  // Handle skip
  const handleSkip = useCallback(() => {
    onSkip()
  }, [onSkip])

  // Get connection state for an integration
  const getConnectionState = (id: string): ConnectionState => {
    return connectionStates[id] || { status: 'idle' }
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Connect Your Apps
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Connect the tools you use every day to automate your workflows.
          {requiredIntegrations.length > 0 && (
            <span className="block mt-1 text-sm text-red-400">
              * Some integrations are required to continue
            </span>
          )}
        </p>
      </motion.div>

      {/* Connected Count Badge */}
      {hasAnyConnections && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">
              {connectedIds.size} app{connectedIds.size !== 1 ? 's' : ''} connected
            </span>
          </div>
        </motion.div>
      )}

      {/* Integration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {sortedIntegrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <IntegrationCard
              integration={integration}
              connectionState={getConnectionState(integration.id)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        {/* Continue Button */}
        <Button
          onClick={handleComplete}
          disabled={requiredIntegrations.length > 0 && !allRequiredConnected}
          variant="cta"
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          {hasAnyConnections ? 'Continue' : 'Continue Without Connections'}
        </Button>

        {/* Skip Button - only show if no required integrations or all required are connected */}
        {(requiredIntegrations.length === 0 || allRequiredConnected) && !hasAnyConnections && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto text-slate-400 hover:text-white"
          >
            Skip for now
          </Button>
        )}
      </motion.div>

      {/* Required Warning */}
      {requiredIntegrations.length > 0 && !allRequiredConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <p className="text-sm text-slate-500">
            Connect all required integrations to continue
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default IntegrationConnector

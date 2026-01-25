/**
 * IntegrationCard Component
 *
 * A reusable card component for displaying integration items.
 * Shows the integration icon, name, description, and connection status.
 * Supports loading, connected, and error states with visual feedback.
 *
 * TypeScript Guidelines:
 * - NO enums (uses const objects with type aliases)
 * - NO parameter properties in constructors
 * - Uses `import type` for type-only imports
 * - Unused params prefixed with underscore
 */

import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Loader2,
  AlertCircle,
  Link,
  ExternalLink,
  Star,
  Mail,
  MessageSquare,
  MessageCircle,
  Cloud,
  Heart,
  Target,
  ShoppingBag,
  ShoppingCart,
  Store,
  CreditCard,
  DollarSign,
  Square,
  FileText,
  Table,
  Grid3X3,
  Zap,
  Rocket,
  Send,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Integration } from './integration-catalog'

// ============================================================================
// Connection Status Types (using const objects, NOT enums)
// ============================================================================

export const CONNECTION_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
} as const

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS]

export interface ConnectionState {
  status: ConnectionStatus
  error?: string
}

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  Mail,
  MessageSquare,
  MessageCircle,
  Cloud,
  Heart,
  Target,
  ShoppingBag,
  ShoppingCart,
  Store,
  CreditCard,
  DollarSign,
  Square,
  FileText,
  Table,
  Grid3X3,
  Zap,
  Rocket,
  Send,
  Users,
}

/**
 * Get the Lucide icon component for an integration
 */
function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Mail
}

// ============================================================================
// Component Props
// ============================================================================

export interface IntegrationCardProps {
  /** The integration data */
  integration: Integration
  /** Current connection state */
  connectionState: ConnectionState
  /** Whether this integration is recommended for the user */
  isRecommended?: boolean
  /** Whether this integration is required */
  isRequired?: boolean
  /** Callback when user clicks to connect */
  onConnect: (integrationId: string) => void
  /** Callback when user clicks to disconnect */
  onDisconnect: (integrationId: string) => void
  /** Animation delay for staggered entry */
  animationDelay?: number
  /** Compact mode for smaller cards */
  compact?: boolean
}

// ============================================================================
// Main Component
// ============================================================================

function IntegrationCardComponent({
  integration,
  connectionState,
  isRecommended = false,
  isRequired = false,
  onConnect,
  onDisconnect,
  animationDelay = 0,
  compact = false,
}: IntegrationCardProps) {
  const isConnecting = connectionState.status === CONNECTION_STATUS.CONNECTING
  const isConnected = connectionState.status === CONNECTION_STATUS.CONNECTED
  const hasError = connectionState.status === CONNECTION_STATUS.ERROR

  const IconComponent = getIconComponent(integration.iconName)

  const handleClick = useCallback(() => {
    if (isConnecting) return

    if (isConnected) {
      onDisconnect(integration.id)
    } else {
      onConnect(integration.id)
    }
  }, [isConnecting, isConnected, integration.id, onConnect, onDisconnect])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <Card
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-pressed={isConnected}
        aria-busy={isConnecting}
        aria-label={`${isConnected ? 'Disconnect from' : 'Connect to'} ${integration.name}`}
        className={cn(
          'relative overflow-hidden transition-all duration-300 cursor-pointer group',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          isConnected
            ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10'
            : hasError
              ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600',
          compact ? 'min-h-[80px]' : 'min-h-[100px]'
        )}
      >
        <CardContent className={cn('p-4', compact && 'p-3')}>
          {/* Badges - Top Right */}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {isRequired && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                Required
              </Badge>
            )}
            {isRecommended && !isRequired && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0">
                Recommended
              </Badge>
            )}
            {integration.isPopular && !isRequired && !isRecommended && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5" />
                Popular
              </Badge>
            )}
          </div>

          {/* Connection Status Indicator - Top Left */}
          <AnimatePresence mode="wait">
            {isConnected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center z-10"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={cn(
                'shrink-0 rounded-xl flex items-center justify-center text-white',
                `bg-gradient-to-br ${integration.iconBgGradient}`,
                isConnecting && 'animate-pulse',
                compact ? 'w-10 h-10' : 'w-12 h-12'
              )}
            >
              {isConnecting ? (
                <Loader2 className={cn('animate-spin', compact ? 'w-5 h-5' : 'w-6 h-6')} />
              ) : (
                <IconComponent className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
              )}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h3
                className={cn(
                  'font-semibold text-white truncate',
                  compact ? 'text-sm' : 'text-sm'
                )}
              >
                {integration.name}
              </h3>
              <p
                className={cn(
                  'text-slate-400 mt-0.5',
                  compact ? 'text-xs line-clamp-1' : 'text-xs line-clamp-2'
                )}
              >
                {integration.description}
              </p>

              {/* Features - Only show if not compact */}
              {!compact && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {integration.features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {hasError && connectionState.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{connectionState.error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover Overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-lg',
              'transition-opacity duration-200',
              isConnected || hasError || isConnecting
                ? 'opacity-0 pointer-events-none'
                : 'opacity-0 group-hover:opacity-100',
              'bg-slate-900/80'
            )}
          >
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Link className="w-4 h-4" />
              <span>Connect</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>

          {/* Connected Overlay on Hover */}
          {isConnected && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-lg',
                'transition-opacity duration-200',
                'opacity-0 group-hover:opacity-100',
                'bg-slate-900/80'
              )}
            >
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                <span>Disconnect</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Memoize for performance
export const IntegrationCard = memo(IntegrationCardComponent)

IntegrationCard.displayName = 'IntegrationCard'

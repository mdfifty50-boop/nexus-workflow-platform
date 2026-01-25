/**
 * UnsupportedToolCard.tsx
 *
 * Smart card that handles workflows requesting unsupported integrations.
 * Shows 3-tier resolution options:
 * 1. API Key setup (if app supports it)
 * 2. Alternative integrations
 * 3. Skip this step option
 *
 * Works with ToolRegistry.ts SupportResolution interface.
 *
 * @NEXUS-FIX-037: UnsupportedToolCard - Smart alternative suggestions - DO NOT REMOVE
 */

import { useState } from 'react'
import { AlertTriangle, Key, ArrowRight, ChevronDown, ChevronUp, Sparkles, SkipForward } from 'lucide-react'
import type { SupportResolution, Alternative } from '../../services/ToolRegistry'

// ================================
// INTEGRATION LOGOS
// ================================

// Map integration names to emojis/icons for quick display
const INTEGRATION_ICONS: Record<string, string> = {
  // Storage
  dropbox: '📦',
  googledrive: '🗂️',
  onedrive: '☁️',
  box: '📁',

  // Communication
  gmail: '✉️',
  outlook: '📧',
  slack: '💬',
  discord: '🎮',
  teams: '👥',
  whatsapp: '📱',
  telegram: '✈️',

  // Productivity
  notion: '📝',
  airtable: '📊',
  googlesheets: '📗',
  excel: '📈',

  // CRM
  hubspot: '🧡',
  salesforce: '☁️',
  pipedrive: '🔄',

  // Payment
  stripe: '💳',
  paypal: '🅿️',
  square: '⬜',

  // Social
  twitter: '🐦',
  linkedin: '💼',
  instagram: '📷',
  facebook: '👤',

  // Project
  asana: '✅',
  trello: '📋',
  monday: '📅',
  linear: '🔷',
  jira: '🔵',
  github: '🐙',

  // Default
  default: '🔌',
}

function getIntegrationIcon(toolkit: string): string {
  return INTEGRATION_ICONS[toolkit.toLowerCase()] || INTEGRATION_ICONS.default
}

// ================================
// COMPONENT PROPS
// ================================

interface UnsupportedToolCardProps {
  /** The tool/integration that was requested but isn't supported */
  requestedTool: string;
  /** Resolution info from ToolRegistry.resolveSupportLevel() */
  resolution: SupportResolution;
  /** Called when user selects an alternative integration */
  onSelectAlternative: (toolkit: string) => void;
  /** Called when user wants to set up API key */
  onSetupAPIKey: () => void;
  /** Called when user wants to skip this step entirely */
  onSkip: () => void;
  /** Optional: Node name for context */
  nodeName?: string;
}

// ================================
// MAIN COMPONENT
// ================================

export function UnsupportedToolCard({
  requestedTool,
  resolution,
  onSelectAlternative,
  onSetupAPIKey,
  onSkip,
  nodeName,
}: UnsupportedToolCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(true)

  // Determine the primary action based on resolution level
  const isPrimaryAPIKey = resolution.level === 'api_key'
  const hasAlternatives = resolution.alternatives && resolution.alternatives.length > 0
  const hasAPIKeyOption = resolution.apiKeyInfo !== undefined

  // Get display name for the requested tool
  const displayName = requestedTool.charAt(0).toUpperCase() + requestedTool.slice(1)
  const icon = getIntegrationIcon(requestedTool)

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 max-w-md">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            {isPrimaryAPIKey
              ? `Connect ${displayName} with your API key`
              : `${displayName} needs a different approach`
            }
          </h3>
          {nodeName && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              For step: {nodeName}
            </p>
          )}
        </div>
      </div>

      {/* Resolution Message */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {resolution.message}
      </p>

      {/* Tier 2: API Key Setup Option */}
      {hasAPIKeyOption && (
        <div className="mb-4">
          <button
            onClick={onSetupAPIKey}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              isPrimaryAPIKey
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Key className="w-4 h-4" />
            Set up {resolution.apiKeyInfo?.displayName || displayName}
          </button>
          {resolution.apiKeyInfo?.apiDocsUrl && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 text-center">
              You'll need your API key from {resolution.apiKeyInfo.displayName}
            </p>
          )}
        </div>
      )}

      {/* Tier 3: Alternatives */}
      {hasAlternatives && (
        <div className="mb-4">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center justify-between w-full text-left mb-2"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Try one of these instead
            </span>
            {showAlternatives ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showAlternatives && (
            <div className="grid grid-cols-2 gap-2">
              {resolution.alternatives!.slice(0, 4).map((alt: Alternative) => (
                <button
                  key={alt.toolkit}
                  onClick={() => onSelectAlternative(alt.toolkit)}
                  className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-left group"
                >
                  <span className="text-lg flex-shrink-0">
                    {getIntegrationIcon(alt.toolkit)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {alt.name}
                    </p>
                    {alt.confidence >= 0.9 && (
                      <p className="text-[10px] text-green-600 dark:text-green-400">
                        Recommended
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Show more if there are many alternatives */}
          {resolution.alternatives!.length > 4 && showAlternatives && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
              +{resolution.alternatives!.length - 4} more alternatives available
            </p>
          )}
        </div>
      )}

      {/* Skip Option */}
      <button
        onClick={onSkip}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
      >
        <SkipForward className="w-4 h-4" />
        Skip this step
      </button>

      {/* Info Footer */}
      {!hasAPIKeyOption && !hasAlternatives && (
        <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This integration isn't available yet. Try a different approach or skip this step.
          </p>
        </div>
      )}
    </div>
  )
}

// ================================
// INTEGRATION LOGO COMPONENT
// ================================

interface IntegrationLogoProps {
  toolkit: string;
  className?: string;
}

export function IntegrationLogo({ toolkit, className = '' }: IntegrationLogoProps) {
  const icon = getIntegrationIcon(toolkit)
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {icon}
    </span>
  )
}

export default UnsupportedToolCard

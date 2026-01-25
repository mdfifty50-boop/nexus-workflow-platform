/**
 * SystemAlerts Component
 *
 * System-level alert banners for:
 * - Maintenance windows
 * - Feature updates
 * - Security notifications
 * - Service status
 * - Dismissible banners
 */

import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { SystemAlertData } from './notification-types'
import {
  SystemAlertType,
  AlertSeverity,
  SEVERITY_COLORS,
} from './notification-types'

// =============================================================================
// Types
// =============================================================================

export interface SystemAlertsProps {
  alerts?: SystemAlertData[]
  onDismiss?: (id: string) => void
  onDismissAll?: () => void
  maxVisible?: number
  className?: string
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_SYSTEM_ALERTS: SystemAlertData[] = [
  {
    id: 'sa1',
    type: SystemAlertType.MAINTENANCE,
    severity: AlertSeverity.WARNING,
    title: 'Scheduled Maintenance',
    message: 'Platform maintenance scheduled for Saturday 2:00 AM - 4:00 AM UTC. Some features may be temporarily unavailable.',
    startTime: new Date(Date.now() + 48 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 50 * 3600000).toISOString(),
    dismissible: true,
    dismissed: false,
    actionUrl: '/status',
    actionLabel: 'View Status Page',
    metadata: {
      affectedServices: ['Workflow Execution', 'API Access'],
      estimatedDuration: '2 hours',
    },
  },
  {
    id: 'sa2',
    type: SystemAlertType.FEATURE_UPDATE,
    severity: AlertSeverity.INFO,
    title: 'New Feature: AI Workflow Suggestions',
    message: 'We\'ve added AI-powered suggestions to help you optimize your workflows. Check it out in the dashboard!',
    startTime: null,
    endTime: null,
    dismissible: true,
    dismissed: false,
    actionUrl: '/features/ai-suggestions',
    actionLabel: 'Learn More',
    metadata: {
      version: '2.5.0',
      changelogUrl: '/changelog',
    },
  },
  {
    id: 'sa3',
    type: SystemAlertType.SERVICE_STATUS,
    severity: AlertSeverity.SUCCESS,
    title: 'All Systems Operational',
    message: 'All services are running normally. No incidents reported.',
    startTime: null,
    endTime: null,
    dismissible: true,
    dismissed: false,
    actionUrl: null,
    actionLabel: null,
    metadata: {},
  },
]

// =============================================================================
// Icon Components
// =============================================================================

function getAlertIcon(type: SystemAlertData['type'], className: string = 'w-5 h-5') {
  switch (type) {
    case SystemAlertType.MAINTENANCE:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case SystemAlertType.FEATURE_UPDATE:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case SystemAlertType.SECURITY:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    case SystemAlertType.SERVICE_STATUS:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case SystemAlertType.ANNOUNCEMENT:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

function XIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// =============================================================================
// Single Alert Banner Component
// =============================================================================

interface AlertBannerProps {
  alert: SystemAlertData
  onDismiss: (id: string) => void
  expanded?: boolean
}

function AlertBanner({ alert, onDismiss, expanded = false }: AlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const colors = SEVERITY_COLORS[alert.severity]

  const formatScheduledTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return null
    const start = new Date(startTime)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    let result = start.toLocaleDateString('en-US', options)
    if (endTime) {
      const end = new Date(endTime)
      result += ` - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    }
    return result
  }

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDismiss(alert.id)
    },
    [alert.id, onDismiss]
  )

  return (
    <div
      className={`
        relative rounded-xl border overflow-hidden transition-all
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Main Banner */}
      <div
        className={`
          flex items-center gap-4 px-4 py-3 cursor-pointer
          ${alert.metadata.affectedServices || alert.metadata.version ? 'hover:bg-slate-800/30' : ''}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon */}
        <div
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            ${colors.icon} ${colors.text}
          `}
        >
          {getAlertIcon(alert.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white">{alert.title}</h4>
            {alert.startTime && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                {formatScheduledTime(alert.startTime, alert.endTime)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">
            {alert.message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {alert.actionUrl && alert.actionLabel && (
            <Link
              to={alert.actionUrl}
              onClick={(e) => e.stopPropagation()}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${colors.text} hover:bg-slate-700/50
              `}
            >
              {alert.actionLabel}
            </Link>
          )}

          {(alert.metadata.affectedServices || alert.metadata.version) && (
            <button
              className={`
                p-1.5 rounded-lg transition-colors
                text-slate-500 hover:text-slate-300 hover:bg-slate-700/50
              `}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {alert.dismissible && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
              aria-label="Dismiss alert"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (alert.metadata.affectedServices || alert.metadata.version) && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700/30">
          <div className="pt-3 grid gap-3 text-sm">
            {alert.metadata.affectedServices && alert.metadata.affectedServices.length > 0 && (
              <div>
                <span className="text-slate-500">Affected Services:</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {alert.metadata.affectedServices.map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {alert.metadata.estimatedDuration && (
              <div>
                <span className="text-slate-500">Estimated Duration:</span>
                <span className="ml-2 text-slate-300">{alert.metadata.estimatedDuration}</span>
              </div>
            )}
            {alert.metadata.version && (
              <div>
                <span className="text-slate-500">Version:</span>
                <span className="ml-2 text-slate-300">{alert.metadata.version}</span>
                {alert.metadata.changelogUrl && (
                  <Link
                    to={alert.metadata.changelogUrl as string}
                    className="ml-2 text-cyan-400 hover:text-cyan-300"
                  >
                    View Changelog
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function SystemAlerts({
  alerts: externalAlerts,
  onDismiss,
  onDismissAll,
  maxVisible = 3,
  className = '',
}: SystemAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  // Use external alerts or mock data
  const alerts = useMemo(() => {
    const source = externalAlerts || MOCK_SYSTEM_ALERTS
    return source.filter((alert) => !alert.dismissed && !dismissedIds.has(alert.id))
  }, [externalAlerts, dismissedIds])

  const visibleAlerts = showAll ? alerts : alerts.slice(0, maxVisible)
  const hiddenCount = alerts.length - maxVisible

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set([...prev, id]))
      onDismiss?.(id)
    },
    [onDismiss]
  )

  const handleDismissAll = useCallback(() => {
    setDismissedIds((prev) => new Set([...prev, ...alerts.map((a) => a.id)]))
    onDismissAll?.()
  }, [alerts, onDismissAll])

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with dismiss all */}
      {alerts.length > 1 && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-400">
            System Alerts ({alerts.length})
          </h3>
          <button
            onClick={handleDismissAll}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Dismiss all
          </button>
        </div>
      )}

      {/* Alert Banners */}
      <div className="space-y-2">
        {visibleAlerts.map((alert) => (
          <AlertBanner key={alert.id} alert={alert} onDismiss={handleDismiss} />
        ))}
      </div>

      {/* Show more/less toggle */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>
              Show less
              <ChevronDownIcon className="w-4 h-4 rotate-180" />
            </>
          ) : (
            <>
              Show {hiddenCount} more alert{hiddenCount > 1 ? 's' : ''}
              <ChevronDownIcon className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default SystemAlerts

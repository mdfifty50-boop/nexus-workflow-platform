/**
 * BillingAlerts Component
 *
 * Billing-specific notification displays for:
 * - Usage limit approaching/reached
 * - Payment failed
 * - Plan expiring
 * - Upgrade offers
 * - Invoice ready
 * - Payment success
 */

import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { BillingAlertData } from './notification-types'
import {
  BillingAlertType,
  AlertSeverity,
  SEVERITY_COLORS,
  formatRelativeTime,
} from './notification-types'

// =============================================================================
// Types
// =============================================================================

export interface BillingAlertsProps {
  alerts?: BillingAlertData[]
  onDismiss?: (id: string) => void
  onAction?: (id: string, action: string) => void
  compact?: boolean
  className?: string
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_BILLING_ALERTS: BillingAlertData[] = [
  {
    id: 'ba1',
    type: BillingAlertType.USAGE_LIMIT_WARNING,
    severity: AlertSeverity.WARNING,
    title: 'Usage Limit Approaching',
    message: "You've used 85% of your monthly workflow executions. Upgrade to avoid interruptions.",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    actionUrl: '/settings/billing/upgrade',
    actionLabel: 'Upgrade Plan',
    metadata: {
      currentUsage: 8500,
      usageLimit: 10000,
      usagePercentage: 85,
      planName: 'Pro',
    },
  },
  {
    id: 'ba2',
    type: BillingAlertType.PAYMENT_FAILED,
    severity: AlertSeverity.ERROR,
    title: 'Payment Failed',
    message: 'Your last payment attempt was declined. Please update your payment method to continue service.',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    actionUrl: '/settings/billing/payment-methods',
    actionLabel: 'Update Payment',
    metadata: {
      amount: 79,
      currency: 'USD',
      paymentMethod: 'Visa ending in 4242',
      retryDate: new Date(Date.now() + 72 * 3600000).toISOString(),
    },
  },
  {
    id: 'ba3',
    type: BillingAlertType.PLAN_EXPIRING,
    severity: AlertSeverity.WARNING,
    title: 'Plan Expiring Soon',
    message: 'Your Pro plan expires in 7 days. Renew now to keep your premium features.',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    actionUrl: '/settings/billing/renew',
    actionLabel: 'Renew Plan',
    metadata: {
      planName: 'Pro',
      expirationDate: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    },
  },
  {
    id: 'ba4',
    type: BillingAlertType.UPGRADE_OFFER,
    severity: AlertSeverity.INFO,
    title: 'Limited Time Offer',
    message: 'Upgrade to Enterprise and get 25% off your first year. Offer ends in 3 days.',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    actionUrl: '/settings/billing/upgrade?offer=25off',
    actionLabel: 'Claim Offer',
    metadata: {
      discountPercentage: 25,
      planName: 'Enterprise',
    },
  },
  {
    id: 'ba5',
    type: BillingAlertType.INVOICE_READY,
    severity: AlertSeverity.INFO,
    title: 'Invoice Ready',
    message: 'Your invoice for January 2024 is now available for download.',
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    actionUrl: '/settings/billing/invoices',
    actionLabel: 'Download',
    metadata: {
      invoiceId: 'INV-2024-001',
      invoiceUrl: '/api/invoices/INV-2024-001/download',
      amount: 79,
      currency: 'USD',
    },
  },
]

// =============================================================================
// Icon Components
// =============================================================================

function getAlertTypeIcon(type: BillingAlertData['type'], className: string = 'w-5 h-5') {
  switch (type) {
    case BillingAlertType.USAGE_LIMIT_WARNING:
    case BillingAlertType.USAGE_LIMIT_REACHED:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case BillingAlertType.PAYMENT_FAILED:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    case BillingAlertType.PLAN_EXPIRING:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case BillingAlertType.UPGRADE_OFFER:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case BillingAlertType.INVOICE_READY:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case BillingAlertType.PAYMENT_SUCCESS:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

interface UsageProgressBarProps {
  current: number
  limit: number
  showLabels?: boolean
}

function UsageProgressBar({ current, limit, showLabels = true }: UsageProgressBarProps) {
  const percentage = Math.min((current / limit) * 100, 100)
  const isWarning = percentage >= 75
  const isCritical = percentage >= 90

  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Usage</span>
          <span className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}>
            {current.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
      )}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabels && (
        <div className="text-right text-xs text-slate-500">
          {percentage.toFixed(0)}% used
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Single Alert Card Component
// =============================================================================

interface AlertCardProps {
  alert: BillingAlertData
  onDismiss: (id: string) => void
  onAction?: (id: string, action: string) => void
  compact: boolean
}

function AlertCard({ alert, onDismiss, onAction: _onAction, compact }: AlertCardProps) {
  // Void unused param per TypeScript rules
  void _onAction

  const colors = SEVERITY_COLORS[alert.severity]

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onDismiss(alert.id)
    },
    [alert.id, onDismiss]
  )

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Render alert-type specific content
  const renderContent = () => {
    switch (alert.type) {
      case BillingAlertType.USAGE_LIMIT_WARNING:
      case BillingAlertType.USAGE_LIMIT_REACHED:
        return (
          <div className="mt-3">
            <UsageProgressBar
              current={alert.metadata.currentUsage || 0}
              limit={alert.metadata.usageLimit || 1}
            />
          </div>
        )

      case BillingAlertType.PAYMENT_FAILED:
        return (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Amount Due</span>
              <span className="text-white font-medium">
                {formatCurrency(alert.metadata.amount || 0, alert.metadata.currency || 'USD')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Payment Method</span>
              <span className="text-slate-400">{alert.metadata.paymentMethod}</span>
            </div>
            {alert.metadata.retryDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Next Retry</span>
                <span className="text-slate-400">{formatDate(alert.metadata.retryDate)}</span>
              </div>
            )}
          </div>
        )

      case BillingAlertType.PLAN_EXPIRING:
        return (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Current Plan</span>
              <span className="text-white font-medium">{alert.metadata.planName}</span>
            </div>
            {alert.metadata.expirationDate && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-500">Expires</span>
                <span className="text-amber-400">{formatDate(alert.metadata.expirationDate)}</span>
              </div>
            )}
          </div>
        )

      case BillingAlertType.UPGRADE_OFFER:
        return (
          <div className="mt-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
              <SparklesIcon className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">
                {alert.metadata.discountPercentage}% off {alert.metadata.planName}
              </span>
            </div>
          </div>
        )

      case BillingAlertType.INVOICE_READY:
        return (
          <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
            <div>
              <span className="text-xs text-slate-500">Invoice</span>
              <p className="text-sm text-white">{alert.metadata.invoiceId}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Amount</span>
              <p className="text-sm text-white">
                {formatCurrency(alert.metadata.amount || 0, alert.metadata.currency || 'USD')}
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg border
          ${colors.bg} ${colors.border}
        `}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon} ${colors.text}`}>
          {getAlertTypeIcon(alert.type, 'w-4 h-4')}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-white font-medium block truncate">{alert.title}</span>
          <span className="text-xs text-slate-500">{formatRelativeTime(alert.createdAt)}</span>
        </div>
        {alert.actionUrl && (
          <Link
            to={alert.actionUrl}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${colors.text} hover:bg-slate-700/50 transition-colors flex-shrink-0`}
          >
            {alert.actionLabel}
          </Link>
        )}
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors flex-shrink-0"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`
        rounded-xl border overflow-hidden
        ${colors.bg} ${colors.border}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${colors.icon} ${colors.text}
            `}
          >
            {getAlertTypeIcon(alert.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-white">{alert.title}</h4>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors flex-shrink-0"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mt-1">{alert.message}</p>

            {renderContent()}

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/30">
              <span className="text-xs text-slate-500">
                {formatRelativeTime(alert.createdAt)}
              </span>
              {alert.actionUrl && (
                <Link
                  to={alert.actionUrl}
                  className={`
                    px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      alert.severity === AlertSeverity.ERROR
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : alert.type === BillingAlertType.UPGRADE_OFFER
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90'
                        : `${colors.bg} ${colors.text} hover:bg-opacity-75`
                    }
                  `}
                >
                  {alert.actionLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function BillingAlerts({
  alerts: externalAlerts,
  onDismiss,
  onAction,
  compact = false,
  className = '',
}: BillingAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Use external alerts or mock data
  const alerts = useMemo(() => {
    const source = externalAlerts || MOCK_BILLING_ALERTS
    return source.filter((alert) => !dismissedIds.has(alert.id))
  }, [externalAlerts, dismissedIds])

  // Sort by severity (errors first, then warnings, then info)
  const sortedAlerts = useMemo(() => {
    const severityOrder = {
      [AlertSeverity.ERROR]: 0,
      [AlertSeverity.WARNING]: 1,
      [AlertSeverity.INFO]: 2,
      [AlertSeverity.SUCCESS]: 3,
    }
    return [...alerts].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    )
  }, [alerts])

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set([...prev, id]))
      onDismiss?.(id)
    },
    [onDismiss]
  )

  if (sortedAlerts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">No billing alerts</p>
        <p className="text-slate-500 text-xs mt-1">Your billing is up to date</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">
          Billing Alerts ({sortedAlerts.length})
        </h3>
        <Link
          to="/settings/billing"
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View Billing
        </Link>
      </div>

      {/* Alert Cards */}
      <div className="space-y-2">
        {sortedAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={handleDismiss}
            onAction={onAction}
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}

export default BillingAlerts

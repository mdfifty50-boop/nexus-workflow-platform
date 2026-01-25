/**
 * ConnectAppStep Component
 *
 * Second step of the onboarding flow (~2 minutes).
 * Guides users to connect their first app via OAuth.
 * Shows recommended apps based on business type selection.
 * Includes skip option for exploring first.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/i18n/useLanguage'
import type { BusinessType } from '@/hooks/useOnboarding'
import { motion, AnimatePresence } from 'framer-motion'

interface ConnectAppStepProps {
  businessType: BusinessType | null
  connectedApps: string[]
  recommendedApps: string[]
  onConnect: (appId: string) => void
  onSkip: () => void
  onNext: () => void
}

interface AppInfo {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

const appDatabase: Record<string, AppInfo> = {
  gmail: { id: 'gmail', name: 'Gmail', icon: '📧', color: 'from-red-500 to-red-600', description: 'Email automation' },
  slack: { id: 'slack', name: 'Slack', icon: '💬', color: 'from-purple-500 to-purple-600', description: 'Team messaging' },
  sheets: { id: 'sheets', name: 'Google Sheets', icon: '📊', color: 'from-green-500 to-green-600', description: 'Spreadsheet data' },
  shopify: { id: 'shopify', name: 'Shopify', icon: '🛍️', color: 'from-green-600 to-lime-500', description: 'E-commerce orders' },
  woocommerce: { id: 'woocommerce', name: 'WooCommerce', icon: '🛒', color: 'from-purple-600 to-indigo-500', description: 'WordPress store' },
  stripe: { id: 'stripe', name: 'Stripe', icon: '💳', color: 'from-indigo-500 to-purple-600', description: 'Payments' },
  salesforce: { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: 'from-blue-500 to-cyan-400', description: 'CRM platform' },
  hubspot: { id: 'hubspot', name: 'HubSpot', icon: '🧡', color: 'from-orange-500 to-red-500', description: 'Marketing & CRM' },
  zendesk: { id: 'zendesk', name: 'Zendesk', icon: '🎫', color: 'from-emerald-500 to-teal-500', description: 'Support tickets' },
  intercom: { id: 'intercom', name: 'Intercom', icon: '💭', color: 'from-blue-400 to-blue-600', description: 'Customer chat' },
  notion: { id: 'notion', name: 'Notion', icon: '📝', color: 'from-slate-600 to-slate-800', description: 'Notes & docs' },
  trello: { id: 'trello', name: 'Trello', icon: '📋', color: 'from-blue-500 to-sky-400', description: 'Task boards' },
}

export function ConnectAppStep({
  businessType,
  connectedApps,
  recommendedApps,
  onConnect,
  onSkip,
  onNext,
}: ConnectAppStepProps) {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [connectingApp, setConnectingApp] = useState<string | null>(null)

  const handleConnectApp = async (appId: string) => {
    setConnectingApp(appId)

    // Simulate OAuth flow - in production this would redirect to OAuth
    // For demo purposes, we'll simulate a 1.5 second connection
    setTimeout(() => {
      onConnect(appId)
      setConnectingApp(null)

      // Auto-advance after first connection
      if (connectedApps.length === 0) {
        setTimeout(() => {
          onNext()
        }, 500)
      }
    }, 1500)
  }

  const handleSkip = () => {
    onSkip()
    onNext()
  }

  // Get apps to display (recommended first, then others)
  const displayApps = recommendedApps
    .filter(id => appDatabase[id])
    .map(id => appDatabase[id])

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {t('onboarding.connect.title')}
        </h2>
        <p className="text-lg text-slate-400 max-w-md mx-auto">
          {t('onboarding.connect.subtitle')}
        </p>
      </motion.div>

      {/* Recommended Apps Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-6"
      >
        <span className="text-sm text-cyan-400">
          {t('onboarding.connect.recommended', { type: t(`onboarding.welcome.options.${businessType || 'custom'}.title`) })}
        </span>
      </motion.div>

      {/* App Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl mb-8">
        {displayApps.map((app, index) => {
          const isConnected = connectedApps.includes(app.id)
          const isConnecting = connectingApp === app.id

          return (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
              onClick={() => !isConnected && !isConnecting && handleConnectApp(app.id)}
              disabled={isConnected || isConnecting}
              className={`
                relative group p-5 rounded-xl border transition-all duration-300
                ${isConnected
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : isConnecting
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                }
              `}
            >
              {/* Status indicator */}
              <AnimatePresence>
                {isConnected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center`}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* App Icon */}
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3
                ${isConnecting ? 'animate-pulse' : ''}
                bg-gradient-to-br ${app.color}
              `}>
                {isConnecting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  app.icon
                )}
              </div>

              {/* App Info */}
              <h3 className="text-base font-semibold text-white mb-1">{app.name}</h3>
              <p className="text-xs text-slate-400">{app.description}</p>

              {/* Connect button overlay */}
              {!isConnected && !isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {t('onboarding.connect.connectButton')}
                  </span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Connected Count */}
      {connectedApps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-emerald-400 mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">
            {t('onboarding.connect.connectedCount', { count: connectedApps.length })}
          </span>
        </motion.div>
      )}

      {/* Skip Link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={handleSkip}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
      >
        {t('onboarding.connect.skipForNow')}
      </motion.button>

      {/* Continue Button (shows after connecting at least one app) */}
      {connectedApps.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all"
        >
          {t('common.continue')}
        </motion.button>
      )}
    </div>
  )
}

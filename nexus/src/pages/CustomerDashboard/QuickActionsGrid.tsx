/**
 * QuickActionsGrid Component
 *
 * Displays quick action buttons for common tasks:
 * - Create new workflow
 * - Browse templates
 * - Manage integrations
 * - View analytics
 * - Account settings
 * - Upgrade plan (if on free tier)
 */

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

// Types
interface QuickAction {
  id: string
  title: string
  description: string
  icon: ReactNode
  href: string
  color: string
  badge?: string
  isExternal?: boolean
  requiresUpgrade?: boolean
}

interface QuickActionsGridProps {
  isFreeTier?: boolean
  onActionClick?: (actionId: string) => void
}

// Icon Components
function PlusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function TemplateIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function IntegrationIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function UpgradeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

// Action Card Component
function ActionCard({
  action,
  onClick,
}: {
  action: QuickAction
  onClick: () => void
}) {
  const colorClasses: Record<string, {
    bg: string
    border: string
    iconBg: string
    iconColor: string
    hoverBorder: string
  }> = {
    cyan: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/50',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      hoverBorder: 'hover:border-cyan-500/50',
    },
    purple: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/50',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      hoverBorder: 'hover:border-purple-500/50',
    },
    emerald: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/50',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/50',
    },
    amber: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/50',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      hoverBorder: 'hover:border-amber-500/50',
    },
    rose: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/50',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
      hoverBorder: 'hover:border-rose-500/50',
    },
    gradient: {
      bg: 'bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-cyan-500/10',
      border: 'border-cyan-500/30',
      iconBg: 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20',
      iconColor: 'text-cyan-400',
      hoverBorder: 'hover:border-cyan-500/50',
    },
  }

  const colors = colorClasses[action.color] || colorClasses.cyan

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left ${colors.bg} rounded-xl border ${colors.border} ${colors.hoverBorder} p-5 hover:bg-slate-800/70 transition-all duration-300 group`}
    >
      {/* Badge */}
      {action.badge && (
        <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded-full">
          {action.badge}
        </span>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl ${colors.iconBg} ${colors.iconColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {action.icon}
      </div>

      {/* Content */}
      <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
        {action.title}
      </h3>
      <p className="text-sm text-slate-400 line-clamp-2">
        {action.description}
      </p>

      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </button>
  )
}

// Main QuickActionsGrid Component
export function QuickActionsGrid({
  isFreeTier = false,
  onActionClick,
}: QuickActionsGridProps) {
  const navigate = useNavigate()

  // Define quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'create-workflow',
      title: 'Create Workflow',
      description: 'Build a new AI-powered automation from scratch',
      icon: <PlusIcon />,
      href: '/workflow-builder',
      color: 'cyan',
    },
    {
      id: 'browse-templates',
      title: 'Browse Templates',
      description: 'Start from pre-built workflow templates',
      icon: <TemplateIcon />,
      href: '/templates',
      color: 'purple',
      badge: 'New',
    },
    {
      id: 'manage-integrations',
      title: 'Integrations',
      description: 'Connect your apps and services',
      icon: <IntegrationIcon />,
      href: '/integrations',
      color: 'emerald',
    },
    {
      id: 'view-analytics',
      title: 'Analytics',
      description: 'Track performance and insights',
      icon: <AnalyticsIcon />,
      href: '/analytics',
      color: 'amber',
    },
    {
      id: 'account-settings',
      title: 'Settings',
      description: 'Manage your account preferences',
      icon: <SettingsIcon />,
      href: '/settings',
      color: 'rose',
    },
  ]

  // Add upgrade action for free tier users
  if (isFreeTier) {
    quickActions.push({
      id: 'upgrade-plan',
      title: 'Upgrade Plan',
      description: 'Unlock unlimited workflows and premium features',
      icon: <UpgradeIcon />,
      href: '/checkout',
      color: 'gradient',
      badge: 'Pro',
      requiresUpgrade: true,
    })
  }

  const handleActionClick = useCallback((action: QuickAction) => {
    if (onActionClick) {
      onActionClick(action.id)
    }

    if (action.isExternal) {
      window.open(action.href, '_blank')
    } else {
      navigate(action.href)
    }
  }, [navigate, onActionClick])

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-white">Quick Actions</h3>
          <p className="text-sm text-slate-400">Common tasks at your fingertips</p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            onClick={() => handleActionClick(action)}
          />
        ))}
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-center gap-2 text-xs text-slate-500">
        <kbd className="px-1.5 py-0.5 bg-slate-700/50 border border-slate-600/50 rounded text-slate-400 font-mono">
          Ctrl
        </kbd>
        <span>+</span>
        <kbd className="px-1.5 py-0.5 bg-slate-700/50 border border-slate-600/50 rounded text-slate-400 font-mono">
          K
        </kbd>
        <span className="ml-2">Quick search & commands</span>
      </div>
    </div>
  )
}

export default QuickActionsGrid

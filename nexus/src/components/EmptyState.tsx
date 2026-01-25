import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  tip?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({
  icon,
  title,
  description,
  tip,
  action,
  secondaryAction,
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="w-12 h-12 text-slate-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  )

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-500">
      {/* Animated icon container with gradient glow */}
      <div className="relative mb-6 group">
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
          {icon || defaultIcon}
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-4 leading-relaxed">{description}</p>

      {/* Helpful tip section */}
      {tip && (
        <div className="flex items-center gap-2 px-4 py-2 mb-6 bg-cyan-500/10 border border-cyan-500/20 rounded-lg max-w-md">
          <span className="text-cyan-400 text-sm">💡</span>
          <span className="text-cyan-300 text-sm">{tip}</span>
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            action.href ? (
              <Link to={action.href}>
                <Button
                  variant="cta"
                  size="lg"
                  leftIcon={<span>✨</span>}
                >
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                variant="cta"
                size="lg"
                onClick={action.onClick}
                leftIcon={<span>✨</span>}
              >
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link to={secondaryAction.href}>
                <Button variant="outline" size="lg">
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="lg" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// Pre-built empty states for common scenarios with helpful tips
export function NoProjectsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      }
      title="Ready to get organized?"
      description="Projects help you group related workflows together. Start with one project and expand as you automate more tasks."
      tip="Most users start with a single 'Main' project and add more later"
      action={{ label: 'Create First Project', href: '/projects' }}
      secondaryAction={{ label: 'Browse Templates', href: '/templates' }}
    />
  )
}

export function NoWorkflowsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      title="Create your first workflow to get started"
      description="Describe any task in plain English and our AI agents will build it for you in seconds. No coding required - just tell us what you want to automate."
      tip="Popular first workflows: Email summaries, calendar reminders, CRM updates"
      action={{ label: 'Create Your First Workflow', href: '/workflow-demo' }}
      secondaryAction={{ label: 'Browse Templates', href: '/templates' }}
    />
  )
}

export function NoResultsEmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No matches found"
      description={`We couldn't find anything matching "${searchTerm}". Try a different search term or browse all items.`}
      tip="Try using fewer keywords or check for typos"
    />
  )
}

export function NoIntegrationsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      }
      title="Connect your tools"
      description="Link your favorite apps like Gmail, Slack, Google Sheets, and more to unlock powerful automations across your entire workflow."
      tip="Gmail and Slack are the most popular starting points"
      action={{ label: 'Browse 50+ Integrations', href: '/integrations' }}
    />
  )
}

export function ErrorEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title="Oops! Something went wrong"
      description="We hit a bump loading this content. This is usually temporary - try refreshing."
      tip="If this keeps happening, our team has been notified"
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  )
}

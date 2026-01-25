import React from 'react'
import { cn } from '@/lib/utils'
import { EmbedContainer, EmbedActionButton, EmbedSection } from './EmbedContainer'
import type { IntegrationPreviewEmbedProps, ConnectionStatus } from './embed-types'
import { CONNECTION_STATUS } from './embed-types'

// Connection status configurations
const CONNECTION_CONFIG: Record<ConnectionStatus, {
  label: string
  className: string
  dotClassName: string
  icon: React.ReactNode
}> = {
  [CONNECTION_STATUS.CONNECTED]: {
    label: 'Connected',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    dotClassName: 'bg-green-500',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  [CONNECTION_STATUS.DISCONNECTED]: {
    label: 'Disconnected',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    dotClassName: 'bg-slate-400',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  [CONNECTION_STATUS.ERROR]: {
    label: 'Error',
    className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    dotClassName: 'bg-red-500 animate-pulse',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  [CONNECTION_STATUS.PENDING]: {
    label: 'Pending',
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    dotClassName: 'bg-amber-500 animate-pulse',
    icon: (
      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
}

// Common integration icons (fallback when no custom icon provided)
const INTEGRATION_ICONS: Record<string, string> = {
  slack: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
  gmail: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg',
  github: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
  notion: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg',
  trello: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/trello.svg',
  jira: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/jira.svg',
  salesforce: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/salesforce.svg',
  hubspot: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hubspot.svg',
  zapier: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/zapier.svg',
  airtable: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/airtable.svg',
}

// Format relative time
function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) return 'Never'

  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

// Health score indicator
function HealthIndicator({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColor().replace('text-', 'bg-'))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium', getColor())}>{score}%</span>
    </div>
  )
}

// Action icons
const ReconnectIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ConfigureIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const RemoveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

/**
 * IntegrationPreviewEmbed - Integration status card for chat messages
 * Displays connection status, last sync, and quick actions
 */
export function IntegrationPreviewEmbed({
  data,
  onReconnect,
  onConfigure,
  onRemove,
  className,
  isLoading,
  isError,
  errorMessage,
}: IntegrationPreviewEmbedProps) {
  const statusConfig = CONNECTION_CONFIG[data.status]
  const integrationIcon = data.iconUrl || data.icon || INTEGRATION_ICONS[data.name.toLowerCase()]

  // Build hover actions
  const hoverActions = (
    <>
      {data.status !== CONNECTION_STATUS.CONNECTED && onReconnect && (
        <EmbedActionButton
          icon={<ReconnectIcon />}
          label="Reconnect"
          onClick={() => onReconnect(data)}
        />
      )}
      {onConfigure && (
        <EmbedActionButton
          icon={<ConfigureIcon />}
          label="Configure"
          onClick={() => onConfigure(data)}
        />
      )}
      {onRemove && (
        <EmbedActionButton
          icon={<RemoveIcon />}
          label="Remove"
          onClick={() => onRemove(data)}
          variant="destructive"
        />
      )}
    </>
  )

  return (
    <EmbedContainer
      className={className}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      onClick={() => onConfigure?.(data)}
      hoverActions={hoverActions}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Integration Icon */}
          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
            {integrationIcon ? (
              typeof integrationIcon === 'string' && integrationIcon.startsWith('http') ? (
                <img
                  src={integrationIcon}
                  alt={data.name}
                  className="w-6 h-6 object-contain dark:invert"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <span className="text-lg">{integrationIcon}</span>
              )
            ) : (
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>

          {/* Title & Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">{data.name}</h4>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                statusConfig.className
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotClassName)} />
                {statusConfig.label}
              </span>
            </div>
            {data.accountInfo && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {data.accountInfo}
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Last sync: {formatRelativeTime(data.lastSync)}</span>
          </div>
          {data.healthScore !== undefined && (
            <HealthIndicator score={data.healthScore} />
          )}
        </div>
      </div>

      {/* Scopes (if available, in collapsible section) */}
      {data.scopes && data.scopes.length > 0 && (
        <EmbedSection title="Permissions">
          <div className="flex flex-wrap gap-1.5">
            {data.scopes.map((scope) => (
              <span
                key={scope}
                className="px-2 py-0.5 bg-muted/50 text-muted-foreground text-xs rounded-md"
              >
                {scope}
              </span>
            ))}
          </div>
        </EmbedSection>
      )}

      {/* Quick Actions Footer */}
      <div className="p-4 pt-0 flex gap-2">
        {data.status === CONNECTION_STATUS.CONNECTED ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onConfigure?.(data)
              }}
              className="flex-1 px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              data-embed-action
            >
              <ConfigureIcon />
              Configure
            </button>
          </>
        ) : data.status === CONNECTION_STATUS.ERROR ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReconnect?.(data)
              }}
              className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
              data-embed-action
            >
              <ReconnectIcon />
              Fix Connection
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReconnect?.(data)
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              data-embed-action
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect
            </button>
          </>
        )}
      </div>
    </EmbedContainer>
  )
}

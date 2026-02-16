/**
 * WorkflowPreviewCard - Auth Prompt Components
 *
 * AuthPrompt (sequential) and ParallelAuthPrompt (connect all at once) components.
 * All @NEXUS-FIX and @NEXUS-UX markers preserved.
 */

import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Loader2,
  ExternalLink,
  Zap,
  Link2,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import type { IntegrationInfo } from '@/services/IntegrationAuthService'
import type { ParallelAuthState } from './wpc-types'

// ============================================================================
// Auth Prompt Component (Sequential)
// ============================================================================

interface AuthPromptProps {
  integration: IntegrationInfo
  redirectUrl: string | null
  onConnect: () => void
  onSkip: () => void
  connectedCount: number
  totalCount: number
  isLoading: boolean
  isPolling: boolean
  pollAttempts: number
}

export function AuthPrompt({
  integration,
  redirectUrl,
  onConnect,
  connectedCount,
  totalCount,
  isLoading,
  isPolling,
  pollAttempts,
}: AuthPromptProps) {
  // Show polling UI when waiting for OAuth to complete
  if (isPolling && redirectUrl) {
    const timeRemaining = Math.max(0, 120 - pollAttempts * 3)
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = timeRemaining % 60

    return (
      <div className="px-4 py-4 space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            Waiting for authorization
          </span>
          <span className="font-mono text-amber-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 animate-pulse"
            style={{ width: `${Math.min(100, (pollAttempts / 40) * 100)}%` }}
          />
        </div>

        {/* Waiting card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl animate-bounce"
              style={{ backgroundColor: `${integration.color}20` }}
            >
              {integration.icon}
            </div>
            <div>
              <h4 className="font-semibold text-white">Complete Authorization</h4>
              <p className="text-xs text-amber-400">Waiting for {integration.name} to connect...</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <span className="text-lg">1.</span>
              <span>A new window/tab has opened for {integration.name}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">2.</span>
              <span>Sign in and authorize Nexus to access your account</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-lg">3.</span>
              <span>Once done, this will update automatically</span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-amber-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Checking connection status...</span>
          </div>

          {/* Re-open auth link */}
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full py-2 rounded-lg text-sm font-medium text-center block border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4 inline mr-2" />
            Re-open authorization window
          </a>
        </div>

        {/* Reassurance text */}
        <p className="text-[10px] text-slate-500 text-center">
          Connection will be detected automatically. Don&apos;t close this page.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Setting up your workflow
        </span>
        <span>
          {connectedCount} of {totalCount} connected
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${(connectedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Integration card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${integration.color}20` }}
          >
            {integration.icon}
          </div>
          <div>
            <h4 className="font-semibold text-white">{integration.name}</h4>
            <p className="text-xs text-slate-400">{integration.description}</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4">{integration.connectMessage}</p>

        {redirectUrl ? (
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onConnect}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
              'bg-gradient-to-r from-purple-500 to-cyan-500 text-white',
              'hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
            )}
          >
            <Link2 className="w-4 h-4" />
            Connect {integration.name}
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
              isLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Getting connection link...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Connect {integration.name}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Reassurance text */}
      <p className="text-[10px] text-slate-500 text-center">
        Secure OAuth connection. We never see your password.
      </p>
    </div>
  )
}

// ============================================================================
// Parallel Auth Prompt Component (MINIMAL CLICKS - Connect All at Once)
// ============================================================================

interface ParallelAuthPromptProps {
  integrations: IntegrationInfo[]
  parallelState: ParallelAuthState
  onConnectAll: () => void
  onConnectSingle: (integration: IntegrationInfo) => void
  isLoading: boolean
  connectedCount: number
}

export function ParallelAuthPrompt({
  integrations,
  parallelState,
  onConnectAll,
  onConnectSingle,
  isLoading,
  connectedCount,
}: ParallelAuthPromptProps) {
  // Total required = pending integrations + already connected integrations
  const totalRequired = integrations.length + connectedCount
  const pendingCount = integrations.length
  const allPolling = integrations.every(i => parallelState[i.id]?.status === 'polling')
  const anyPolling = integrations.some(i => parallelState[i.id]?.status === 'polling')

  // Calculate max time remaining across all polling integrations
  const maxPollAttempts = Math.max(
    ...integrations.map(i => parallelState[i.id]?.pollAttempts || 0)
  )
  const timeRemaining = Math.max(0, 120 - maxPollAttempts * 3)
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  // @NEXUS-UX-003: OAuth prompt with VIP hospitality - DO NOT REMOVE
  return (
    <div className="px-4 py-4 space-y-4">
      {/* @NEXUS-UX-003: Exciting header - connection unlocks superpowers */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          {anyPolling ? 'Almost there...' : 'Unlock Your Workflow'}
        </span>
        <span className="flex items-center gap-2">
          {anyPolling && (
            <span className="font-mono text-amber-400">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          )}
          <span className="text-emerald-400">{connectedCount}/{totalRequired} ready</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            anyPolling
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 animate-pulse'
              : 'bg-gradient-to-r from-purple-500 to-cyan-500'
          )}
          style={{ width: `${(connectedCount / totalRequired) * 100}%` }}
        />
      </div>

      {/* Integration grid - show all at once */}
      <div className="space-y-2">
        {integrations.map((integration) => {
          const state = parallelState[integration.id] || { status: 'pending', pollAttempts: 0 }
          const isConnected = state.status === 'connected'
          const isIntegrationPolling = state.status === 'polling'
          const hasError = state.status === 'error'

          return (
            <div
              key={integration.id}
              className={cn(
                'p-3 rounded-xl border transition-all duration-300',
                isConnected
                  ? 'bg-emerald-900/20 border-emerald-500/30'
                  : isIntegrationPolling
                  ? 'bg-amber-900/20 border-amber-500/30'
                  : hasError
                  ? 'bg-red-900/20 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${integration.color}20` }}
                  >
                    {integration.icon}
                  </div>
                  {/* @NEXUS-UX-003: Friendly status messages - DO NOT REMOVE */}
                  <div>
                    <h4 className="font-medium text-white text-sm">{integration.name}</h4>
                    <p className="text-xs text-slate-400">
                      {isConnected
                        ? 'Ready to go!'
                        : isIntegrationPolling
                        ? 'Complete sign-in in the popup...'
                        : hasError
                        ? `${state.error || 'Let\'s try again'}`
                        : 'One click to connect'}
                    </p>
                  </div>
                </div>

                {/* Status indicator or action button */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isIntegrationPolling ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                      {state.authUrl && (
                        <a
                          href={state.authUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-400 hover:underline"
                        >
                          Re-open
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onConnectSingle(integration)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* @NEXUS-UX-003: Connect All Button with exciting copy - DO NOT REMOVE */}
      {pendingCount > 0 && !allPolling && (
        <button
          onClick={onConnectAll}
          disabled={isLoading || anyPolling}
          className={cn(
            'w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
            isLoading || anyPolling
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing secure connections...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              {pendingCount === 1 ? 'Connect & Unlock' : `Connect All ${pendingCount} Apps`}
            </>
          )}
        </button>
      )}

      {/* @NEXUS-UX-003: Polling instructions with friendly guidance - DO NOT REMOVE */}
      {anyPolling && (
        <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20">
          <div className="text-sm text-amber-200">
            <p className="font-medium mb-1">Complete the sign-in in the popup windows</p>
            <p className="text-xs text-amber-300/70">
              Just click "Allow" or "Authorize" in each window. This page updates automatically when done!
            </p>
          </div>
        </div>
      )}

      {/* @NEXUS-UX-003: Reassurance with friendlier tone - DO NOT REMOVE */}
      <p className="text-[10px] text-slate-500 text-center">
        Your passwords stay with {pendingCount > 1 ? 'the apps' : 'the app'} -- we only get permission to automate tasks for you
      </p>
    </div>
  )
}

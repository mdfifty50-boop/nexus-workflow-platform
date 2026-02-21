/**
 * AutopilotPanel - Primary Autopilot UI component.
 *
 * Manages the full Autopilot lifecycle: idle preview, execution with live
 * screenshots, credential prompts, completion summary, error fallback to
 * GuidedInstructions. Connects to AutopilotService via SSE for real-time
 * updates.
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │  Nexus Autopilot               [Close] │
 * ├────────────────────────────────────────┤
 * │  [Screenshot / Plan / Summary]         │
 * ├────────────────────────────────────────┤
 * │  [AutopilotProgress]                   │
 * ├────────────────────────────────────────┤
 * │  [AutopilotControls]                   │
 * └────────────────────────────────────────┘
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { AutopilotProgress, type AutopilotProgressStep } from './AutopilotProgress'
import { AutopilotControls } from './AutopilotControls'
import { CredentialPrompt } from './CredentialPrompt'
import { GuidedInstructions } from './GuidedInstructions'

// -------------------------------------------------------------------
// Types (mirrors the service layer that will be created separately)
// -------------------------------------------------------------------

export type AutopilotState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'credential_wait'
  | 'paused'
  | 'verifying'
  | 'complete'
  | 'error'
  | 'cancelled'

export type AutopilotStep = AutopilotProgressStep

interface WorkflowSpec {
  name: string
  description: string
  steps: Array<{ id: string; name: string; tool: string; type: string }>
  requiredIntegrations: string[]
  estimatedTimeSaved?: string
}

interface AutopilotPanelProps {
  workflowSpec: WorkflowSpec | null
  onClose: () => void
  onComplete?: () => void
}

// -------------------------------------------------------------------
// Service interfaces
//
// The real implementations live in @/services/AutopilotService and
// @/services/AutopilotActionPlanner. When they exist, import them
// at the top of this file and pass via props or wire directly.
// Until then, the panel operates in preview-only mode using built-in
// defaults and shows an actionable error when the user tries to start.
// -------------------------------------------------------------------

export interface IAutopilotEventHandler {
  onScreenshot?: (event: { image: string; step: number; description: string; url: string; timestamp: number }) => void
  onStatus?: (event: { state: string; step: number; message: string; credentialService?: string }) => void
  onProgress?: (event: { completedSteps: number; totalSteps: number; currentStep: string; estimatedRemaining: number }) => void
  onComplete?: (results: unknown) => void
  onError?: (error: { step: number; error: string; fallback: string }) => void
}

export interface IAutopilotService {
  createSession: (spec: WorkflowSpec) => Promise<string>
  startSession: (id: string) => Promise<void>
  subscribe: (id: string, handlers: IAutopilotEventHandler) => void
  unsubscribe: () => void
  pause: (id: string) => Promise<void>
  resume: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
}

export interface IAutopilotActionPlanner {
  planActions: (spec: WorkflowSpec) => AutopilotStep[]
}

// Wire the real service implementations
import { autopilotService as realAutopilotService } from '@/services/AutopilotService'
import { autopilotActionPlanner as realAutopilotActionPlanner } from '@/services/AutopilotActionPlanner'

const autopilotService: IAutopilotService | null = realAutopilotService as unknown as IAutopilotService
const autopilotActionPlanner: IAutopilotActionPlanner | null = realAutopilotActionPlanner as unknown as IAutopilotActionPlanner

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/** Capitalize and prettify a service slug for display. */
function prettifyService(slug: string): string {
  const names: Record<string, string> = {
    gmail: 'Gmail',
    slack: 'Slack',
    googlesheets: 'Google Sheets',
    googledrive: 'Google Drive',
    dropbox: 'Dropbox',
    github: 'GitHub',
    notion: 'Notion',
    discord: 'Discord',
    trello: 'Trello',
    asana: 'Asana',
    linear: 'Linear',
    hubspot: 'HubSpot',
    stripe: 'Stripe',
    zoom: 'Zoom',
    twitter: 'Twitter / X',
    linkedin: 'LinkedIn',
  }
  return names[slug.toLowerCase()] || slug.charAt(0).toUpperCase() + slug.slice(1)
}

/** Service slug to emoji. */
function serviceEmoji(slug: string): string {
  const icons: Record<string, string> = {
    gmail: '📧', slack: '💬', googlesheets: '📊', googledrive: '📁',
    dropbox: '📦', github: '🐙', notion: '📝', discord: '🎮',
    trello: '📋', asana: '✅', linear: '🔵', hubspot: '🟠',
    stripe: '💳', zoom: '📹', twitter: '🐦', linkedin: '💼',
  }
  return icons[slug.toLowerCase()] || '🔗'
}

/** Safe array coercion - prevents `prev.map is not a function` from HMR state corruption */
function safeArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? v : []
}

/** Build a default step list from the workflowSpec when the planner is unavailable. */
function buildDefaultSteps(spec: WorkflowSpec): AutopilotStep[] {
  return spec.requiredIntegrations.map((svc, i) => ({
    id: `auto_${i}`,
    service: prettifyService(svc),
    description: `Connect and configure ${prettifyService(svc)}`,
    status: 'pending' as const,
    method: 'browser' as const,
  }))
}

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------

export function AutopilotPanel({ workflowSpec, onClose, onComplete }: AutopilotPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [state, setState] = useState<AutopilotState>('idle')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [steps, setSteps] = useState<AutopilotStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [credentialService, setCredentialService] = useState<string | null>(null)
  const [credentialServiceName, setCredentialServiceName] = useState<string>('')
  const [isNewAccount, setIsNewAccount] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGuidedFallback, setShowGuidedFallback] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0, remaining: 0 })

  const sessionRef = useRef(sessionId)
  sessionRef.current = sessionId

  const stateRef = useRef(state)
  stateRef.current = state

  // Derive planned steps from workflowSpec
  useEffect(() => {
    if (!workflowSpec) return
    const planned = autopilotActionPlanner
      ? autopilotActionPlanner.planActions(workflowSpec)
      : buildDefaultSteps(workflowSpec)
    setSteps(planned)
    setProgress({ completed: 0, total: planned.length, remaining: planned.length * 30 })
  }, [workflowSpec])

  // SSE event handler
  const handleSSEEvent = useCallback(
    (evt: Record<string, unknown>) => {
      const type = evt.type as string | undefined

      switch (type) {
        case 'screenshot':
          setScreenshot(evt.data as string)
          break

        case 'step_start': {
          const idx = evt.stepIndex as number
          setCurrentStep(idx)
          setSteps((prev) =>
            safeArr<AutopilotStep>(prev).map((s, i) => (i === idx ? { ...s, status: 'executing' } : s))
          )
          setState('executing')
          break
        }

        case 'step_complete': {
          const idx = evt.stepIndex as number
          setSteps((prev) =>
            safeArr<AutopilotStep>(prev).map((s, i) => (i === idx ? { ...s, status: 'complete' } : s))
          )
          setProgress((p) => ({
            ...p,
            completed: p.completed + 1,
            remaining: Math.max(0, (p.total - p.completed - 1) * 30),
          }))
          break
        }

        case 'step_error': {
          const idx = evt.stepIndex as number
          setSteps((prev) =>
            safeArr<AutopilotStep>(prev).map((s, i) => (i === idx ? { ...s, status: 'error' } : s))
          )
          setError((evt.message as string) || 'An error occurred during configuration')
          setState('error')
          break
        }

        case 'credential_required':
          setCredentialService(evt.service as string)
          setCredentialServiceName(prettifyService(evt.service as string))
          setIsNewAccount(!!(evt.isNewAccount as boolean | undefined))
          setState('credential_wait')
          setSteps((prev) =>
            safeArr<AutopilotStep>(prev).map((s, i) =>
              i === (evt.stepIndex as number) ? { ...s, status: 'credential_wait' } : s
            )
          )
          break

        case 'session_complete':
          setState('complete')
          setProgress((p) => ({ ...p, completed: p.total, remaining: 0 }))
          break

        case 'state_change':
          if (evt.state) setState(evt.state as AutopilotState)
          break

        default:
          break
      }
    },
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autopilotService?.unsubscribe()
      const id = sessionRef.current
      const st = stateRef.current
      if (id && st !== 'complete' && st !== 'cancelled') {
        autopilotService?.cancel(id).catch(() => {})
      }
    }
  }, [])

  // ------ Actions ------

  const handleStart = useCallback(async () => {
    if (!workflowSpec || !autopilotService) {
      // If no service available, show a helpful message
      setError('Autopilot service is not available yet. Use guided instructions instead.')
      setState('error')
      return
    }

    try {
      setState('planning')
      const session = await autopilotService.createSession(workflowSpec)
      const id = typeof session === 'string' ? session : (session as { sessionId: string }).sessionId
      setSessionId(id)
      // Subscribe to SSE events using the real service's event handler interface
      autopilotService.subscribe(id, {
        onScreenshot: (evt) => handleSSEEvent({ type: 'screenshot', data: evt.image, stepIndex: evt.step }),
        onStatus: (evt) => {
          handleSSEEvent({ type: 'state_change', state: evt.state })
          if (evt.state === 'credential_wait' && evt.credentialService) {
            handleSSEEvent({ type: 'credential_required', stepIndex: evt.step, service: evt.credentialService })
          }
        },
        onProgress: (evt) => {
          setProgress({ completed: evt.completedSteps, total: evt.totalSteps, remaining: evt.estimatedRemaining })
          handleSSEEvent({ type: 'step_start', stepIndex: evt.completedSteps })
        },
        onComplete: () => handleSSEEvent({ type: 'session_complete' }),
        onError: (evt) => {
          setError(evt.error)
          handleSSEEvent({ type: 'step_error', stepIndex: evt.step })
        },
      })
      await autopilotService.startSession(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Autopilot session')
      setState('error')
    }
  }, [workflowSpec, handleSSEEvent])

  const handlePause = useCallback(async () => {
    if (!sessionId || !autopilotService) return
    try {
      await autopilotService.pause(sessionId)
      setState('paused')
    } catch {
      // ignore
    }
  }, [sessionId])

  const handleResume = useCallback(async () => {
    if (!sessionId || !autopilotService) return
    try {
      await autopilotService.resume(sessionId)
      setState('executing')
      setCredentialService(null)
    } catch {
      // ignore
    }
  }, [sessionId])

  const handleCancel = useCallback(async () => {
    if (state === 'complete') {
      onComplete?.()
      onClose()
      return
    }
    if (sessionId && autopilotService) {
      try {
        await autopilotService.cancel(sessionId)
      } catch {
        // ignore
      }
    }
    setState('cancelled')
    onClose()
  }, [sessionId, state, onClose, onComplete])

  const handleRetry = useCallback(async () => {
    setError(null)
    // Reset failed steps to pending
    setSteps((prev) =>
      safeArr<AutopilotStep>(prev).map((s) => (s.status === 'error' ? { ...s, status: 'pending' } : s))
    )
    await handleStart()
  }, [handleStart])

  const handleCredentialResume = useCallback(() => {
    setCredentialService(null)
    handleResume()
  }, [handleResume])

  const handleSwitchToGuided = useCallback(() => {
    setShowGuidedFallback(true)
  }, [])

  const handleGuidedComplete = useCallback(() => {
    setShowGuidedFallback(false)
    setState('complete')
    setProgress((p) => ({ ...p, completed: p.total, remaining: 0 }))
    setSteps((prev) => safeArr<AutopilotStep>(prev).map((s) => ({ ...s, status: 'complete' as const })))
  }, [])

  // ------ Render helpers ------

  const renderIdleView = () => {
    if (!workflowSpec) {
      // No workflow context yet — show a friendly placeholder
      return (
        <div className="flex flex-col items-center text-center p-8 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Autopilot Ready</h3>
            <p className="text-sm text-surface-400 max-w-xs leading-relaxed">
              Discuss your automation needs with the consultants. Once we understand which services you need, Autopilot will configure everything for you automatically.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/50 border border-surface-700/50">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-surface-400">Listening to discussion...</span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center text-center p-6 space-y-5">
        {/* Workflow info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{workflowSpec.name}</h3>
          <p className="text-sm text-surface-400 max-w-sm">{workflowSpec.description}</p>
        </div>

        {/* Services to configure */}
        <div className="w-full max-w-sm space-y-2">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">
            Services to configure
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {workflowSpec.requiredIntegrations.map((svc) => (
              <div
                key={svc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-sm"
              >
                <span>{serviceEmoji(svc)}</span>
                <span className="text-surface-300">{prettifyService(svc)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time estimate */}
        {workflowSpec.estimatedTimeSaved && (
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>Saves {workflowSpec.estimatedTimeSaved}</span>
          </div>
        )}

        {/* Estimated config time */}
        <p className="text-xs text-surface-500">
          Estimated setup time: ~{Math.max(1, workflowSpec.requiredIntegrations.length)} min
        </p>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="flex items-center gap-2.5 px-8 py-3 rounded-2xl text-base font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3" />
          </svg>
          Start Autopilot
        </button>
      </div>
    )
  }

  const renderScreenshot = () => (
    <div className="relative w-full aspect-video bg-surface-950 rounded-lg overflow-hidden border border-surface-700/50">
      {screenshot ? (
        <img
          src={`data:image/jpeg;base64,${screenshot}`}
          className="w-full h-full object-contain"
          alt="Autopilot browser view"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <svg className="w-8 h-8 text-surface-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <span className="text-sm text-surface-500">
            {state === 'planning' ? 'Preparing browser...' : 'Waiting for screenshot...'}
          </span>
        </div>
      )}

      {/* Live badge */}
      {(state === 'executing' || state === 'credential_wait') && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-900/80 backdrop-blur-sm border border-surface-700/50">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-medium text-surface-300 uppercase tracking-wider">Live</span>
        </div>
      )}

      {/* Credential prompt overlay */}
      {state === 'credential_wait' && credentialService && (
        <CredentialPrompt
          service={credentialService}
          serviceName={credentialServiceName}
          onResume={handleCredentialResume}
          onCancel={handleCancel}
          isNewAccount={isNewAccount}
        />
      )}
    </div>
  )

  const renderCompleteView = () => (
    <div className="flex flex-col items-center text-center p-6 space-y-4">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Configuration Complete</h3>
        <p className="text-sm text-surface-400">
          All integrations have been set up successfully.
        </p>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 text-xs text-surface-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{progress.completed} configured</span>
        </div>
        {steps.some((s) => s.status === 'skipped') && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-surface-600" />
            <span>{steps.filter((s) => s.status === 'skipped').length} skipped</span>
          </div>
        )}
      </div>

      {workflowSpec?.estimatedTimeSaved && (
        <p className="text-sm text-cyan-400">
          You'll save {workflowSpec.estimatedTimeSaved} with this workflow
        </p>
      )}
    </div>
  )

  const renderErrorView = () => (
    <div className="flex flex-col items-center text-center p-6 space-y-4">
      {/* Error icon */}
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">Something went wrong</h3>
        <p className="text-sm text-surface-400 max-w-sm">
          {error || 'An unexpected error occurred during configuration.'}
        </p>
      </div>

      {/* Fallback option */}
      <button
        onClick={handleSwitchToGuided}
        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
        Switch to manual instructions
      </button>
    </div>
  )

  // ------ Guided Instructions fallback ------

  if (showGuidedFallback && workflowSpec) {
    const guidedSteps = workflowSpec.requiredIntegrations.map((svc) => ({
      title: `Connect ${prettifyService(svc)}`,
      description: `Open ${prettifyService(svc)} and authorize Nexus to access your account. Follow the OAuth prompts to grant the necessary permissions.`,
      url: `https://${svc.toLowerCase()}.com`,
    }))

    return (
      <div className="flex flex-col h-full bg-surface-900 rounded-2xl border border-surface-700/50 overflow-hidden">
        <GuidedInstructions
          steps={guidedSteps}
          service={workflowSpec.requiredIntegrations[0] || 'app'}
          serviceName={workflowSpec.name}
          onComplete={handleGuidedComplete}
          onCancel={onClose}
        />
      </div>
    )
  }

  // ------ Main render ------

  return (
    <div className="flex flex-col h-full bg-surface-900 rounded-2xl border border-surface-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Nexus Autopilot</h2>
            {state !== 'idle' && (
              <p className="text-[10px] text-surface-500 uppercase tracking-wider">
                {state === 'planning' && 'Planning...'}
                {state === 'executing' && 'Configuring...'}
                {state === 'credential_wait' && 'Awaiting credentials'}
                {state === 'paused' && 'Paused'}
                {state === 'verifying' && 'Verifying...'}
                {state === 'complete' && 'Complete'}
                {state === 'error' && 'Error'}
                {state === 'cancelled' && 'Cancelled'}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 hover:text-surface-300 transition-colors"
          aria-label="Close Autopilot panel"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Idle: Action plan preview */}
        {state === 'idle' && renderIdleView()}

        {/* Active states: Screenshot area */}
        {(state === 'planning' ||
          state === 'executing' ||
          state === 'credential_wait' ||
          state === 'paused' ||
          state === 'verifying') && (
          <div className="p-4">
            {renderScreenshot()}
          </div>
        )}

        {/* Complete */}
        {state === 'complete' && renderCompleteView()}

        {/* Error */}
        {state === 'error' && renderErrorView()}

        {/* Step progress (visible during active states) */}
        {state !== 'idle' && state !== 'cancelled' && steps.length > 0 && (
          <div className="px-4 pb-3">
            <AutopilotProgress
              steps={steps}
              currentStep={currentStep}
              compact={state === 'complete'}
            />
          </div>
        )}
      </div>

      {/* Controls footer */}
      {state !== 'idle' && state !== 'cancelled' && (
        <div className="px-4 py-3 border-t border-surface-700/50">
          <AutopilotControls
            state={state}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancel}
            onRetry={handleRetry}
            completedSteps={progress.completed}
            totalSteps={progress.total}
            estimatedRemaining={progress.remaining}
          />
        </div>
      )}
    </div>
  )
}

export default AutopilotPanel

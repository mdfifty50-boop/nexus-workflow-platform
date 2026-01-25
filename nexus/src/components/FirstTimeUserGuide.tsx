import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { ProfessionalAvatar } from './ProfessionalAvatar'

// Local storage keys for tracking user progress
const STORAGE_KEYS = {
  GUIDE_DISMISSED: 'nexus_guide_dismissed',
  ONBOARDING_COMPLETE: 'nexus_onboarding_complete',
  FIRST_WORKFLOW_CREATED: 'nexus_first_workflow_created',
  FIRST_INTEGRATION_CONNECTED: 'nexus_first_integration_connected',
  PROFILE_COMPLETED: 'nexus_profile_completed',
}

interface ChecklistItem {
  id: string
  label: string
  description: string
  completed: boolean
  action: {
    label: string
    href?: string
    onClick?: () => void
  }
  icon: React.ReactNode
}

// Hook to check if user is new (no workflows created, recent signup)
export function useIsNewUser(): boolean {
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEYS.GUIDE_DISMISSED)
    const firstWorkflow = localStorage.getItem(STORAGE_KEYS.FIRST_WORKFLOW_CREATED)

    // User is "new" if they haven't dismissed the guide AND haven't created a workflow
    setIsNew(!dismissed && !firstWorkflow)
  }, [])

  return isNew
}

// Hook to get user setup progress
export function useSetupProgress() {
  const [progress, setProgress] = useState({
    onboardingComplete: false,
    firstWorkflowCreated: false,
    firstIntegrationConnected: false,
    profileCompleted: false,
  })

  useEffect(() => {
    setProgress({
      onboardingComplete: localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true',
      firstWorkflowCreated: localStorage.getItem(STORAGE_KEYS.FIRST_WORKFLOW_CREATED) === 'true',
      firstIntegrationConnected: localStorage.getItem(STORAGE_KEYS.FIRST_INTEGRATION_CONNECTED) === 'true',
      profileCompleted: localStorage.getItem(STORAGE_KEYS.PROFILE_COMPLETED) === 'true',
    })
  }, [])

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalCount = Object.keys(progress).length
  const percentComplete = Math.round((completedCount / totalCount) * 100)

  return { ...progress, completedCount, totalCount, percentComplete }
}

// Mark a step as complete
export function markStepComplete(step: keyof typeof STORAGE_KEYS) {
  localStorage.setItem(STORAGE_KEYS[step], 'true')
}

// Dismiss the guide entirely
export function dismissGuide() {
  localStorage.setItem(STORAGE_KEYS.GUIDE_DISMISSED, 'true')
}

// =============================================================================
// WELCOME BANNER - Shows at top of Dashboard for new users
// =============================================================================

interface WelcomeBannerProps {
  userName?: string
  onDismiss: () => void
  onCreateWorkflow: () => void
}

export function WelcomeBanner({ userName, onDismiss, onCreateWorkflow }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20 p-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Dismiss welcome message"
      >
        <XIcon className="w-4 h-4" />
      </button>

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar and greeting */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <ProfessionalAvatar agentId="nexus" size={48} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-background">
              <span className="text-xs">👋</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Welcome{userName ? `, ${userName}` : ''}!
            </h2>
            <p className="text-muted-foreground text-sm">
              I'm Nexus, your AI automation assistant
            </p>
          </div>
        </div>

        {/* Quick action */}
        <div className="flex-1 md:text-right">
          <p className="text-sm text-muted-foreground mb-3">
            Ready to automate your first task?
          </p>
          <Button onClick={onCreateWorkflow} size="lg" className="shadow-lg shadow-primary/25">
            <SparklesIcon className="w-4 h-4 mr-2" />
            Create Your First Workflow
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// GETTING STARTED CHECKLIST - Floating card showing setup progress
// =============================================================================

interface GettingStartedChecklistProps {
  onDismiss: () => void
  compact?: boolean
}

export function GettingStartedChecklist({ onDismiss, compact = false }: GettingStartedChecklistProps) {
  const navigate = useNavigate()
  const progress = useSetupProgress()

  const checklistItems: ChecklistItem[] = [
    {
      id: 'onboarding',
      label: 'Complete onboarding',
      description: 'Tell us about yourself',
      completed: progress.onboardingComplete,
      action: { label: 'Start', href: '/settings' },
      icon: <UserIcon className="w-4 h-4" />,
    },
    {
      id: 'workflow',
      label: 'Create your first workflow',
      description: 'Describe what you want to automate',
      completed: progress.firstWorkflowCreated,
      action: { label: 'Create', href: '/workflow-demo' },
      icon: <WorkflowIcon className="w-4 h-4" />,
    },
    {
      id: 'integration',
      label: 'Connect an app',
      description: 'Link Gmail, Slack, or other tools',
      completed: progress.firstIntegrationConnected,
      action: { label: 'Connect', href: '/integrations' },
      icon: <IntegrationIcon className="w-4 h-4" />,
    },
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add your details for better AI help',
      completed: progress.profileCompleted,
      action: { label: 'Edit', href: '/profile' },
      icon: <ProfileIcon className="w-4 h-4" />,
    },
  ]

  const incompleteItems = checklistItems.filter(item => !item.completed)
  const nextItem = incompleteItems[0]

  if (compact) {
    // Compact inline version for the dashboard
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <RocketIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Getting Started</h3>
              <p className="text-xs text-muted-foreground">{progress.completedCount}/{progress.totalCount} complete</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss checklist"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>

        {/* Next action */}
        {nextItem && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="text-cyan-400">{nextItem.icon}</div>
              <span className="text-sm">{nextItem.label}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-cyan-400 hover:text-cyan-300"
              onClick={() => nextItem.action.href && navigate(nextItem.action.href)}
            >
              {nextItem.action.label}
              <ChevronRightIcon className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Full checklist card
  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <RocketIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                {progress.percentComplete}% complete
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Dismiss checklist"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="p-4 space-y-2">
        {checklistItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              item.completed
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Checkbox */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.completed
                ? 'bg-emerald-500 text-white'
                : 'border-2 border-muted-foreground/50'
            }`}>
              {item.completed && <CheckIcon className="w-3.5 h-3.5" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>

            {/* Action */}
            {!item.completed && (
              item.action.href ? (
                <Link to={item.action.href}>
                  <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                    {item.action.label}
                    <ChevronRightIcon className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-cyan-400 hover:text-cyan-300"
                  onClick={item.action.onClick}
                >
                  {item.action.label}
                  <ChevronRightIcon className="w-3 h-3 ml-1" />
                </Button>
              )
            )}
          </div>
        ))}
      </div>

      {/* Footer tip */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
          <LightbulbIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-amber-200">
            <strong>Tip:</strong> Most users start by creating a simple email notification workflow
          </span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CONTEXTUAL HINTS - Small inline hints for specific pages
// =============================================================================

interface ContextualHintProps {
  message: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  onDismiss?: () => void
  variant?: 'info' | 'tip' | 'action'
  className?: string
}

export function ContextualHint({
  message,
  actionLabel,
  actionHref,
  onAction,
  onDismiss,
  variant = 'info',
  className = '',
}: ContextualHintProps) {
  const variants = {
    info: {
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      icon: <InfoIcon className="w-4 h-4 text-cyan-400" />,
      text: 'text-cyan-200',
    },
    tip: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: <LightbulbIcon className="w-4 h-4 text-amber-400" />,
      text: 'text-amber-200',
    },
    action: {
      bg: 'bg-purple-500/10 border-purple-500/20',
      icon: <SparklesIcon className="w-4 h-4 text-purple-400" />,
      text: 'text-purple-200',
    },
  }

  const style = variants[variant]

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${style.bg} animate-in fade-in duration-300 ${className}`}>
      {style.icon}
      <span className={`flex-1 text-sm ${style.text}`}>{message}</span>

      {actionLabel && (
        actionHref ? (
          <Link to={actionHref}>
            <Button size="sm" variant="ghost" className="text-sm">
              {actionLabel}
              <ChevronRightIcon className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="ghost" className="text-sm" onClick={onAction}>
            {actionLabel}
            <ChevronRightIcon className="w-3 h-3 ml-1" />
          </Button>
        )
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground"
          aria-label="Dismiss hint"
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// =============================================================================
// WORKFLOW DEMO GUIDANCE - Specific guidance for the workflow builder
// =============================================================================

interface WorkflowDemoGuidanceProps {
  onDismiss: () => void
  hasInput: boolean
}

export function WorkflowDemoGuidance({ onDismiss, hasInput }: WorkflowDemoGuidanceProps) {
  if (hasInput) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <ProfessionalAvatar agentId="nexus" size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">Start by telling me what to automate</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Type something like "Send me a daily summary of my emails" or "When I get a lead, add it to my CRM"
            </p>
            <div className="flex flex-wrap gap-2">
              <ExampleChip text="Summarize my emails" />
              <ExampleChip text="Sync calendar to Slack" />
              <ExampleChip text="Track social mentions" />
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground"
            aria-label="Dismiss guidance"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ExampleChip({ text }: { text: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs text-cyan-300 border border-cyan-500/30">
      {text}
    </span>
  )
}

// =============================================================================
// THREE STEPS QUICK START - Simple 3-step visual guide
// =============================================================================

export function ThreeStepsQuickStart() {
  const steps = [
    {
      number: 1,
      title: 'Describe your task',
      description: 'Tell Nexus what you want to automate in plain English',
      icon: <ChatIcon className="w-5 h-5" />,
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      number: 2,
      title: 'Connect your apps',
      description: 'One-click OAuth to link Gmail, Slack, and more',
      icon: <IntegrationIcon className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
    },
    {
      number: 3,
      title: 'Watch it run',
      description: 'Your workflow executes automatically',
      icon: <PlayIcon className="w-5 h-5" />,
      color: 'from-emerald-500 to-emerald-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className="relative p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all animate-in fade-in duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Step number */}
          <div className={`absolute -top-3 -left-2 w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
            {step.number}
          </div>

          {/* Connector line (not on last item) */}
          {index < steps.length - 1 && (
            <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-border to-transparent" />
          )}

          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.color} bg-opacity-20 flex items-center justify-center text-white`}>
                {step.icon}
              </div>
              <h4 className="font-semibold">{step.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// ICONS
// =============================================================================

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function IntegrationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

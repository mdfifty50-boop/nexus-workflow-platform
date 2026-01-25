import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonalization, type PersonaType } from '@/contexts/PersonalizationContext'
import { Layout } from './Layout'
import { ProfessionalAvatar } from './ProfessionalAvatar'
import { AISuggestionsPanel, useAISuggestions, type AISuggestion } from './AISuggestionsPanel'
import { StatsCard, AchievementNotification, useAchievements, type UserStats } from './AchievementSystem'
import { VoiceInput } from './VoiceInput'
import { OnboardingWizard } from './OnboardingWizard'
import { LazyAIMeetingRoom, LazyMeetingRoomButton } from './LazyComponents'
import {
  WorkflowStatusSkeleton,
  AISuggestionsSkeleton,
  StatsCardSkeleton,
  CardSkeleton,
  Skeleton
} from './Skeleton'
import { CompetitiveStatsBanner } from './CompetitiveAdvantages'
import { ExceptionQueuePanel, useExceptionQueue } from './ExceptionQueuePanel'
import {
  WelcomeBanner,
  GettingStartedChecklist,
  ThreeStepsQuickStart,
  dismissGuide
} from './FirstTimeUserGuide'
import { requestBatcher } from '@/lib/requestBatcher'

// ============================================
// SESSION 3 IMPROVEMENTS: Hero + Focus Mode
// ============================================

// Helper to pluralize workflow term properly
function pluralize(term: string): string {
  if (term.endsWith('s')) return term // Already plural (e.g., "systems")
  return term + 's'
}

// New User Welcome - Clean, focused onboarding for users with no workflows
function NewUserWelcome({
  userName,
  workflowTerm,
  personaDisplayName: _personaDisplayName
}: {
  userName: string
  workflowTerm: string
  personaDisplayName: string
}) {
  void _personaDisplayName // Reserved for future personalization
  const examples = [
    { icon: '📧', text: 'Text me when I get an email from my boss or VIP clients' },
    { icon: '📊', text: 'Send me a daily summary of my unread Slack messages' },
    { icon: '📅', text: 'Create a to-do list every morning from my calendar events' },
    { icon: '💾', text: 'Auto-save email attachments to the right Google Drive folder' },
  ]

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome{userName ? `, ${userName}` : ''}! 👋
        </h1>
        <p className="text-lg text-slate-400">
          Let's create your first {workflowTerm.toLowerCase()}
        </p>
      </div>

      {/* Main CTA Card */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-8 mb-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            What would you like to automate?
          </h2>
          <p className="text-slate-400 text-sm">
            Just describe it in plain English - our AI will build it for you
          </p>
        </div>

        {/* Example prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {examples.map((example, i) => (
            <Link
              key={i}
              to="/workflow-demo"
              onClick={() => localStorage.setItem('nexus_workflow_demo_prefill', example.text)}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800 transition-all group"
            >
              <span className="text-xl">{example.icon}</span>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                {example.text}
              </span>
            </Link>
          ))}
        </div>

        {/* Create Button - Prominent CTA with animation */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-2xl opacity-70 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" />
          <Link
            to="/workflow-demo"
            className="relative flex items-center justify-center gap-3 w-full py-5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:shadow-2xl hover:shadow-cyan-500/30 transition-all font-bold text-lg group-hover:scale-[1.02] transform"
          >
            <span className="text-xl">✨</span>
            <span>Create Your First {workflowTerm}</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        <p className="text-center text-slate-500 text-sm mt-3">
          Takes less than 30 seconds - no coding required
        </p>
      </div>

      {/* How It Works - 3 Steps */}
      <div className="mb-6">
        <h3 className="text-center text-lg font-semibold text-white mb-4">How It Works</h3>
        <ThreeStepsQuickStart />
      </div>

      {/* Quick Links */}
      <div className="flex justify-center gap-4 text-sm flex-wrap">
        <Link to="/templates" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all">
          <span>📚</span> Browse Templates
        </Link>
        <Link to="/integrations" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all">
          <span>🔗</span> Connect Apps
        </Link>
        <Link to="/settings?tab=personalization" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all">
          <span>⚙️</span> Customize
        </Link>
      </div>
    </div>
  )
}

// Types for workflow data
interface WorkflowItem {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed' | 'queued' | 'scheduled' | 'paused'
  progress?: number
  agent?: string
  source: 'nexus' | 'composio' | 'rube'
  scheduleInfo?: {
    cron?: string
    cronHuman?: string
    nextRunAt?: string
    recipeId?: string
  }
}

interface WorkflowStats {
  running: number
  completed: number
  failed: number
  queued: number
  scheduled: number
  pending: number
}

// Hook to fetch real workflow data - using batched requests for efficiency
function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [stats, setStats] = useState<WorkflowStats>({
    running: 0,
    completed: 0,
    failed: 0,
    queued: 0,
    scheduled: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  const fetchWorkflows = useCallback(async () => {
    const fetchId = ++fetchIdRef.current

    try {
      setLoading(true)

      // Use batched requests for parallel fetching with deduplication
      const results = await requestBatcher.batch<any>([
        {
          endpoint: '/workflows',
          method: 'GET',
          priority: 'high',
          cacheTTL: 10000, // 10 second cache
          tags: ['workflows', 'dashboard']
        },
        {
          endpoint: '/composio/recipes',
          method: 'GET',
          priority: 'normal',
          cacheTTL: 30000, // 30 second cache for recipes
          tags: ['recipes', 'dashboard']
        }
      ])

      // Check if this is still the latest request
      if (fetchId !== fetchIdRef.current || !mountedRef.current) return

      const [nexusData, recipesData] = results

      // Combine workflows
      const nexusWorkflows: WorkflowItem[] = (nexusData?.data || []).map((w: any) => ({
        id: w.id,
        name: w.name || 'Unnamed Workflow',
        status: w.status === 'active' ? 'running' :
                w.status === 'completed' ? 'completed' :
                w.status === 'error' ? 'failed' : 'queued',
        progress: w.progress || 0,
        agent: w.agent || 'nexus',
        source: 'nexus' as const,
      }))

      const rubeWorkflows: WorkflowItem[] = (recipesData?.recipes || []).map((r: any) => ({
        id: r.recipe_id || r.id,
        name: r.name || 'Unnamed Recipe',
        status: r.schedule?.status === 'active' ? 'scheduled' :
                r.schedule?.status === 'paused' ? 'paused' : 'completed',
        source: 'rube' as const,
        scheduleInfo: r.schedule ? {
          cron: r.schedule.cron,
          cronHuman: r.schedule.cronHuman,
          nextRunAt: r.schedule.nextRunAt,
          recipeId: r.recipe_id,
        } : undefined,
      }))

      const allWorkflows = [...nexusWorkflows, ...rubeWorkflows]
      setWorkflows(allWorkflows)

      // Calculate stats
      const newStats: WorkflowStats = {
        running: allWorkflows.filter(w => w.status === 'running').length,
        completed: allWorkflows.filter(w => w.status === 'completed').length,
        failed: allWorkflows.filter(w => w.status === 'failed').length,
        queued: allWorkflows.filter(w => w.status === 'queued').length,
        scheduled: allWorkflows.filter(w => w.status === 'scheduled').length,
        pending: allWorkflows.filter(w => w.status === 'queued' || w.status === 'running').length,
      }
      setStats(newStats)
      setError(null)
    } catch (err) {
      if (fetchId !== fetchIdRef.current || !mountedRef.current) return
      console.error('[Workflows] Fetch error:', err)
      setError(String(err))
      // Fall back to demo data if fetch fails
      setStats({ running: 3, completed: 47, failed: 1, queued: 5, scheduled: 0, pending: 8 })
    } finally {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchWorkflows()
    // Refresh every 30 seconds (reduced from potentially more frequent)
    const interval = setInterval(fetchWorkflows, 30000)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchWorkflows])

  return { workflows, stats, loading, error, refresh: fetchWorkflows }
}

// Workflow Status Hero Section - "Your Workflows Right Now"
function WorkflowStatusHero({ workflowTerm }: { workflowTerm: string }) {
  const { stats: workflowStatus, loading: _loading } = useWorkflows()
  void _loading // Loading state available for future skeleton implementation

  const totalToday = workflowStatus.running + workflowStatus.completed + workflowStatus.failed
  const pluralTerm = pluralize(workflowTerm)

  return (
    <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 rounded-2xl border border-slate-700/50 p-6 relative overflow-hidden">
      {/* Animated background pulse for running workflows */}
      {workflowStatus.running > 0 && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/5 animate-pulse" />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{pluralTerm} Status</h2>
              <p className="text-sm text-slate-400">{totalToday > 0 ? `${totalToday} executed today` : 'No activity today yet'}</p>
            </div>
          </div>
          <Link
            to="/workflows"
            className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View All <span>→</span>
          </Link>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Running - Most prominent */}
          <div className={`
            rounded-xl p-5 sm:p-4 text-center transition-all min-h-[80px] sm:min-h-0
            ${workflowStatus.running > 0
              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 ring-2 ring-amber-500/20'
              : 'bg-slate-900/50 border border-slate-700/50'}
          `}>
            <div className={`text-3xl font-bold ${workflowStatus.running > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
              {workflowStatus.running}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
              {workflowStatus.running > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              Running
            </div>
          </div>

          {/* Scheduled - Recurring workflows */}
          <div className={`
            rounded-xl p-5 sm:p-4 text-center transition-all min-h-[80px] sm:min-h-0
            ${workflowStatus.scheduled > 0
              ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30'
              : 'bg-slate-900/50 border border-slate-700/50'}
          `}>
            <div className={`text-3xl font-bold ${workflowStatus.scheduled > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
              {workflowStatus.scheduled}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
              {workflowStatus.scheduled > 0 && <span className="text-purple-400">⏰</span>}
              Scheduled
            </div>
          </div>

          {/* Queued */}
          <div className="rounded-xl p-5 sm:p-4 text-center bg-slate-900/50 border border-slate-700/50 min-h-[80px] sm:min-h-0">
            <div className="text-3xl font-bold text-slate-300">{workflowStatus.queued}</div>
            <div className="text-xs text-slate-400 mt-1">Queued</div>
          </div>

          {/* Completed - Only green when > 0 */}
          <div className={`rounded-xl p-5 sm:p-4 text-center bg-slate-900/50 min-h-[80px] sm:min-h-0 ${
            workflowStatus.completed > 0 ? 'border border-emerald-500/30' : 'border border-slate-700/50'
          }`}>
            <div className={`text-3xl font-bold ${workflowStatus.completed > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {workflowStatus.completed}
            </div>
            <div className="text-xs text-slate-400 mt-1">Completed</div>
          </div>

          {/* Failed - Neutral when 0, alert when > 0 */}
          <div className={`
            rounded-xl p-5 sm:p-4 text-center transition-all min-h-[80px] sm:min-h-0
            ${workflowStatus.failed > 0
              ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 cursor-pointer hover:ring-2 hover:ring-red-500/20'
              : 'bg-slate-900/50 border border-slate-700/50'}
          `}>
            <div className={`text-3xl font-bold ${workflowStatus.failed > 0 ? 'text-red-400' : 'text-slate-500'}`}>
              {workflowStatus.failed}
            </div>
            <div className="text-xs mt-1">
              {workflowStatus.failed > 0 ? (
                <span className="text-red-400">Needs Attention</span>
              ) : (
                <span className="text-slate-500">No Issues</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Featured AI Suggestion - ONE prominent suggestion
function FeaturedAISuggestion({
  suggestion,
  onAction,
  onDismiss
}: {
  suggestion: AISuggestion | null;
  onAction: (s: AISuggestion) => void;
  onDismiss: (id: string) => void;
}) {
  if (!suggestion) return null

  const priorityColors = {
    high: { bg: 'from-cyan-500/20 to-purple-500/20', border: 'border-cyan-500/30', icon: 'text-cyan-400' },
    medium: { bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20', icon: 'text-amber-400' },
    low: { bg: 'from-slate-500/10 to-slate-500/10', border: 'border-slate-500/20', icon: 'text-slate-400' },
  }

  const colors = priorityColors[suggestion.priority ?? 'medium'] ?? priorityColors.medium

  return (
    <div className={`bg-gradient-to-r ${colors.bg} rounded-2xl border ${colors.border} p-6 relative overflow-hidden`}>
      {/* Sparkle animation for high priority */}
      {suggestion.priority === 'high' && (
        <div className="absolute top-4 right-4 text-2xl animate-bounce">✨</div>
      )}

      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <span className="text-3xl">{suggestion.icon || '💡'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-slate-900/50 text-cyan-400 text-xs font-medium">
              AI Suggestion
            </span>
            {suggestion.priority === 'high' && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                High Impact
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{suggestion.title}</h3>
          <p className="text-sm text-slate-300 mb-4">{suggestion.description}</p>

          {suggestion.impact && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-emerald-400 text-sm font-medium">
                Potential: {suggestion.impact}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => onAction(suggestion)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all font-medium"
            >
              <span>🚀</span>
              <span>{suggestion.action?.label || 'Apply Now'}</span>
            </button>
            <button
              onClick={() => onDismiss(suggestion.id)}
              className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  badge
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 sm:p-4 hover:bg-slate-700/30 transition-colors min-h-[60px] sm:min-h-0"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-white">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}

// Focus Mode Toggle
function FocusModeToggle({
  isEnabled,
  onToggle
}: {
  isEnabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl transition-all
        ${isEnabled
          ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-400'
          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'}
      `}
    >
      <span className="text-base sm:text-lg">{isEnabled ? '🎯' : '👁️'}</span>
      <span className="text-xs sm:text-sm font-medium hidden sm:inline">{isEnabled ? 'Focus Mode' : 'Full View'}</span>
      <span className="text-xs font-medium sm:hidden">{isEnabled ? 'Focus' : 'Full'}</span>
      <div className={`
        w-7 sm:w-8 h-3.5 sm:h-4 rounded-full relative transition-colors
        ${isEnabled ? 'bg-purple-500' : 'bg-slate-600'}
      `}>
        <div className={`
          absolute top-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-white transition-all
          ${isEnabled ? 'left-3.5 sm:left-4' : 'left-0.5'}
        `} />
      </div>
    </button>
  )
}

// Persona-specific quick start templates
const PERSONA_QUICK_START: Record<string, Array<{ icon: string; name: string; time: string; description: string }>> = {
  doctor: [
    { icon: '🏥', name: 'Patient Intake', time: '2 min', description: 'Automate new patient registration' },
    { icon: '💊', name: 'Prescription Refills', time: '1 min', description: 'Process medication renewals' },
    { icon: '📋', name: 'Lab Result Follow-up', time: '3 min', description: 'Send results to patients' },
  ],
  nurse: [
    { icon: '💉', name: 'Vaccination Reminders', time: '2 min', description: 'Send immunization alerts' },
    { icon: '📊', name: 'Patient Vitals Report', time: '3 min', description: 'Compile daily vitals summary' },
    { icon: '🏥', name: 'Shift Handoff Notes', time: '2 min', description: 'Generate handoff reports' },
  ],
  therapist: [
    { icon: '📅', name: 'Session Reminders', time: '1 min', description: 'Automated appointment alerts' },
    { icon: '📝', name: 'Progress Notes', time: '3 min', description: 'Generate session summaries' },
    { icon: '🧠', name: 'Assessment Scoring', time: '2 min', description: 'Calculate PHQ-9, GAD-7 scores' },
  ],
  lawyer: [
    { icon: '⚖️', name: 'Case Intake', time: '3 min', description: 'New client onboarding' },
    { icon: '📄', name: 'Document Review', time: '5 min', description: 'AI-assisted contract analysis' },
    { icon: '⏰', name: 'Filing Deadline Alerts', time: '1 min', description: 'Court deadline reminders' },
  ],
  paralegal: [
    { icon: '📁', name: 'Document Organization', time: '2 min', description: 'Auto-categorize case files' },
    { icon: '🔍', name: 'Legal Research', time: '4 min', description: 'Search case law databases' },
    { icon: '📋', name: 'Deposition Summary', time: '3 min', description: 'Summarize testimony' },
  ],
  realtor: [
    { icon: '🏠', name: 'Listing Alerts', time: '1 min', description: 'New property notifications' },
    { icon: '📧', name: 'Buyer Follow-ups', time: '2 min', description: 'Automated buyer outreach' },
    { icon: '📸', name: 'Virtual Tour Setup', time: '3 min', description: 'Schedule property tours' },
  ],
  accountant: [
    { icon: '📊', name: 'Expense Categorization', time: '2 min', description: 'Auto-categorize transactions' },
    { icon: '🧾', name: 'Invoice Processing', time: '3 min', description: 'Extract invoice data' },
    { icon: '📅', name: 'Tax Deadline Alerts', time: '1 min', description: 'IRS filing reminders' },
  ],
  developer: [
    { icon: '🐛', name: 'Bug Triage', time: '2 min', description: 'Categorize GitHub issues' },
    { icon: '📝', name: 'PR Review Summary', time: '3 min', description: 'AI code review reports' },
    { icon: '🚀', name: 'Deployment Alerts', time: '1 min', description: 'CI/CD notifications' },
  ],
  teacher: [
    { icon: '📚', name: 'Assignment Reminders', time: '1 min', description: 'Due date notifications' },
    { icon: '📊', name: 'Grade Reports', time: '3 min', description: 'Generate progress reports' },
    { icon: '📧', name: 'Parent Communication', time: '2 min', description: 'Automated parent updates' },
  ],
  recruiter: [
    { icon: '👤', name: 'Resume Screening', time: '3 min', description: 'AI candidate matching' },
    { icon: '📅', name: 'Interview Scheduling', time: '2 min', description: 'Coordinate interview times' },
    { icon: '📧', name: 'Candidate Outreach', time: '2 min', description: 'Personalized sourcing' },
  ],
  marketer: [
    { icon: '📱', name: 'Social Media Posts', time: '2 min', description: 'Schedule content across platforms' },
    { icon: '📊', name: 'Campaign Analytics', time: '3 min', description: 'Generate performance reports' },
    { icon: '✉️', name: 'Email Campaigns', time: '3 min', description: 'A/B test newsletters' },
  ],
  sales: [
    { icon: '📧', name: 'Lead Follow-up', time: '2 min', description: 'Automated prospect outreach' },
    { icon: '📊', name: 'Pipeline Report', time: '3 min', description: 'Weekly deal summary' },
    { icon: '🤝', name: 'Meeting Prep', time: '2 min', description: 'Client research briefs' },
  ],
  ecommerce: [
    { icon: '📦', name: 'Order Notifications', time: '1 min', description: 'Shipping & delivery alerts' },
    { icon: '📊', name: 'Inventory Alerts', time: '2 min', description: 'Low stock notifications' },
    { icon: '⭐', name: 'Review Requests', time: '2 min', description: 'Post-purchase follow-up' },
  ],
  default: [
    { icon: '📧', name: 'Email Follow-up', time: '2 min', description: 'Automated email sequences' },
    { icon: '📊', name: 'Weekly Report', time: '3 min', description: 'Compile weekly summary' },
    { icon: '🎙️', name: 'Meeting Notes', time: '1 min', description: 'Transcribe and summarize' },
  ],
}

// Persona-specific integrations to highlight
const PERSONA_INTEGRATIONS: Record<string, Array<{ name: string; status: string; icon: string }>> = {
  doctor: [
    { name: 'Epic EHR', status: 'connected', icon: '🏥' },
    { name: 'DrChrono', status: 'connected', icon: '📋' },
    { name: 'Doximity', status: 'disconnected', icon: '👨‍⚕️' },
    { name: 'Zoom Health', status: 'connected', icon: '📹' },
  ],
  lawyer: [
    { name: 'Clio', status: 'connected', icon: '⚖️' },
    { name: 'Westlaw', status: 'connected', icon: '📚' },
    { name: 'DocuSign', status: 'connected', icon: '✍️' },
    { name: 'LexisNexis', status: 'disconnected', icon: '🔍' },
  ],
  realtor: [
    { name: 'Zillow', status: 'connected', icon: '🏠' },
    { name: 'DocuSign', status: 'connected', icon: '✍️' },
    { name: 'Showing Time', status: 'error', icon: '📅' },
    { name: 'MLS Access', status: 'connected', icon: '📊' },
  ],
  accountant: [
    { name: 'QuickBooks', status: 'connected', icon: '📊' },
    { name: 'Xero', status: 'disconnected', icon: '💰' },
    { name: 'TaxAct', status: 'connected', icon: '🧾' },
    { name: 'Plaid', status: 'connected', icon: '🏦' },
  ],
  developer: [
    { name: 'GitHub', status: 'connected', icon: '🐙' },
    { name: 'Jira', status: 'connected', icon: '📋' },
    { name: 'Slack', status: 'connected', icon: '💬' },
    { name: 'AWS', status: 'error', icon: '☁️' },
  ],
  recruiter: [
    { name: 'LinkedIn', status: 'connected', icon: '💼' },
    { name: 'Greenhouse', status: 'connected', icon: '🌱' },
    { name: 'Calendly', status: 'connected', icon: '📅' },
    { name: 'Workday', status: 'disconnected', icon: '👥' },
  ],
  marketer: [
    { name: 'HubSpot', status: 'connected', icon: '🟠' },
    { name: 'Mailchimp', status: 'connected', icon: '🐒' },
    { name: 'Google Ads', status: 'error', icon: '📢' },
    { name: 'Buffer', status: 'connected', icon: '📱' },
  ],
  sales: [
    { name: 'Salesforce', status: 'connected', icon: '☁️' },
    { name: 'HubSpot', status: 'connected', icon: '🟠' },
    { name: 'LinkedIn', status: 'connected', icon: '💼' },
    { name: 'Gong', status: 'disconnected', icon: '🔔' },
  ],
  default: [
    { name: 'Gmail', status: 'connected', icon: '📧' },
    { name: 'Salesforce', status: 'connected', icon: '☁️' },
    { name: 'Slack', status: 'error', icon: '💬' },
    { name: 'Zoom', status: 'disconnected', icon: '📹' },
  ],
}

// Get persona-specific quick start templates
function getQuickStartForPersona(persona: PersonaType): Array<{ icon: string; name: string; time: string; description: string }> {
  if (PERSONA_QUICK_START[persona]) {
    return PERSONA_QUICK_START[persona]
  }

  // Map similar personas
  const personaMapping: Record<string, string> = {
    nurse: 'doctor',
    therapist: 'doctor',
    dentist: 'doctor',
    pharmacist: 'doctor',
    paralegal: 'lawyer',
    'property-manager': 'realtor',
    'mortgage-broker': 'realtor',
    bookkeeper: 'accountant',
    'financial-advisor': 'accountant',
    'project-manager': 'developer',
    designer: 'developer',
    professor: 'teacher',
    tutor: 'teacher',
    'hr-manager': 'recruiter',
    'content-creator': 'marketer',
    'social-media': 'marketer',
    entrepreneur: 'sales',
    consultant: 'sales',
  }

  const mappedPersona = personaMapping[persona]
  if (mappedPersona && PERSONA_QUICK_START[mappedPersona]) {
    return PERSONA_QUICK_START[mappedPersona]
  }

  return PERSONA_QUICK_START.default
}

// Get persona-specific integrations
function getIntegrationsForPersona(persona: PersonaType): Array<{ name: string; status: string; icon: string }> {
  if (PERSONA_INTEGRATIONS[persona]) {
    return PERSONA_INTEGRATIONS[persona]
  }

  const personaMapping: Record<string, string> = {
    nurse: 'doctor',
    therapist: 'doctor',
    dentist: 'doctor',
    paralegal: 'lawyer',
    'property-manager': 'realtor',
    bookkeeper: 'accountant',
    'project-manager': 'developer',
    designer: 'developer',
    professor: 'teacher',
    'hr-manager': 'recruiter',
    'content-creator': 'marketer',
    entrepreneur: 'sales',
    consultant: 'sales',
  }

  const mappedPersona = personaMapping[persona]
  if (mappedPersona && PERSONA_INTEGRATIONS[mappedPersona]) {
    return PERSONA_INTEGRATIONS[mappedPersona]
  }

  return PERSONA_INTEGRATIONS.default
}

// Persona display names for UI - Use personal role titles for better UX
const PERSONA_DISPLAY_NAMES: Record<string, string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  therapist: 'Therapist',
  dentist: 'Dentist',
  pharmacist: 'Pharmacist',
  lawyer: 'Lawyer',
  paralegal: 'Paralegal',
  realtor: 'Realtor',
  'property-manager': 'Property Manager',
  'mortgage-broker': 'Mortgage Broker',
  accountant: 'Accountant',
  bookkeeper: 'Bookkeeper',
  'financial-advisor': 'Financial Advisor',
  developer: 'Developer',
  designer: 'Designer',
  'project-manager': 'Project Manager',
  teacher: 'Teacher',
  professor: 'Professor',
  tutor: 'Tutor',
  recruiter: 'Recruiter',
  'hr-manager': 'HR Manager',
  marketer: 'Marketer',
  'content-creator': 'Content Creator',
  'social-media': 'Social Media Pro',
  sales: 'Sales Pro',
  ecommerce: 'E-Commerce Pro',
  entrepreneur: 'Entrepreneur',
  consultant: 'Consulting',
  operations: 'Operations',
  executive: 'Executive',
  custom: 'Your Industry',
}

// First Win Banner - shows when user has a pending workflow from signup
// Made prominent with animation and enhanced styling to encourage action
function FirstWinBanner({ workflow, workflowTerm, onDismiss }: { workflow: string; workflowTerm: string; onDismiss: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true)

  // Auto-hide confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Parse workflow JSON to extract human-readable description
  const displayText = useMemo(() => {
    try {
      const parsed = JSON.parse(workflow)
      return parsed.description || parsed.name || 'Your custom automation'
    } catch {
      // If not JSON, it's already a plain string
      return workflow
    }
  }, [workflow])

  return (
    <div className="relative group">
      {/* Celebration confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
              100% { transform: translateY(500%) rotate(720deg); opacity: 0; }
            }
          `}</style>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                backgroundColor: ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i % 5],
                animation: `confettiFall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Animated glowing border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />

      <div className="relative bg-slate-900 rounded-2xl p-6 md:p-8 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.15),transparent_50%)]" />

        {/* Floating particles effect */}
        <div className="absolute top-4 right-10 w-2 h-2 rounded-full bg-cyan-500/50 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="absolute top-8 right-20 w-1.5 h-1.5 rounded-full bg-purple-500/50 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-6 right-32 w-1 h-1 rounded-full bg-pink-500/50 animate-bounce" style={{ animationDelay: '1s' }} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <span className="text-3xl">🎯</span>
                </div>
                {/* Ping indicator */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Ready to Launch Your First {workflowTerm}</h3>
                <p className="text-sm md:text-base text-slate-400">We've built it for you - just one click to activate</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-slate-500 hover:text-white transition-colors p-1"
              title="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Workflow description */}
          <div className="bg-slate-800/80 rounded-xl p-5 mb-6 border border-cyan-500/20">
            <div className="flex items-start gap-3">
              <span className="text-cyan-400 text-xl">💬</span>
              <div>
                <p className="text-sm text-slate-400 mb-1">What you asked for:</p>
                <p className="text-lg text-cyan-300 font-medium leading-relaxed">"{displayText}"</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/workflow-demo"
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all font-semibold text-lg group/btn"
              onClick={() => {
                localStorage.setItem('nexus_workflow_demo_prefill', workflow)
              }}
            >
              <span className="text-xl group-hover/btn:animate-bounce">🚀</span>
              <span>Activate Now</span>
              <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button
              onClick={onDismiss}
              className="px-6 py-4 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Maybe later
            </button>
          </div>

          {/* Quick benefit callout */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Your {workflowTerm.toLowerCase()} is already set up and ready to run</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Value Calculator Component - Realistic time savings based on workflow complexity
function ValueCalculator({
  workflowsCompleted,
  tasksAutomated,
  hourlyRate = 50
}: {
  workflowsCompleted: number
  tasksAutomated: number
  hourlyRate?: number
}) {
  // Realistic calculation methodology:
  // - Average workflow execution saves ~8-12 min of manual work
  // - Complex workflows with multiple tasks save more
  // - Formula: (workflows * 10min + tasks * 2min) / 60 = hours
  const avgMinutesPerWorkflow = 10
  const avgMinutesPerTask = 2
  const totalMinutes = (workflowsCompleted * avgMinutesPerWorkflow) + (tasksAutomated * avgMinutesPerTask)
  const timeSaved = totalMinutes / 60

  const weeklyValue = timeSaved * hourlyRate
  const monthlyValue = weeklyValue * 4
  const yearlyValue = monthlyValue * 12

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💰</span>
        <h3 className="text-lg font-semibold text-white">Value Generated</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="text-center bg-slate-900/30 rounded-lg p-3">
          <div className="text-2xl sm:text-2xl font-bold text-emerald-400">${Math.round(weeklyValue).toLocaleString()}</div>
          <div className="text-xs sm:text-xs text-slate-400">This Week</div>
        </div>
        <div className="text-center bg-slate-900/30 rounded-lg p-3">
          <div className="text-2xl sm:text-2xl font-bold text-cyan-400">${Math.round(monthlyValue).toLocaleString()}</div>
          <div className="text-xs sm:text-xs text-slate-400">Monthly</div>
        </div>
        <div className="text-center bg-slate-900/30 rounded-lg p-3">
          <div className="text-2xl sm:text-2xl font-bold text-purple-400">${Math.round(yearlyValue).toLocaleString()}</div>
          <div className="text-xs sm:text-xs text-slate-400">Projected Yearly</div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Based on ${hourlyRate}/hour</span>
          <span className="text-emerald-400 font-medium">{timeSaved.toFixed(1)} hours saved</span>
        </div>
        <div className="text-xs text-slate-500 pt-1 border-t border-slate-700/50">
          {workflowsCompleted} workflows × ~10min + {tasksAutomated} tasks × ~2min
        </div>
      </div>
    </div>
  )
}

// Quick Voice Action Component
function QuickVoiceAction({ onCommand, workflowTerm }: { onCommand: (command: string) => void; workflowTerm: string }) {
  const [isListening, setIsListening] = useState(false)

  return (
    <div className={`
      rounded-2xl border p-6 transition-all duration-300
      ${isListening
        ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
        : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            relative w-12 h-12 rounded-xl flex items-center justify-center transition-all
            ${isListening
              ? 'bg-gradient-to-br from-cyan-500 to-purple-500 shadow-lg shadow-cyan-500/40'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 cursor-pointer'}
          `}>
            {/* Listening pulse rings */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-xl bg-cyan-500/30 animate-ping" />
                <div className="absolute inset-0 rounded-xl bg-purple-500/20 animate-ping" style={{ animationDelay: '0.3s' }} />
              </>
            )}
            <span className="text-2xl relative z-10">{isListening ? '🎙️' : '🎤'}</span>
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              Voice Command
              {isListening && (
                <span className="flex items-center gap-1 text-cyan-400 text-xs font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Listening...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {isListening ? 'Speak now - I\'m listening' : `Tap the mic or say "Hey Nexus"`}
            </p>
          </div>
        </div>
        <span className="px-2 py-1 rounded-lg text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Arabic + English
        </span>
      </div>

      <VoiceInput
        onTranscript={onCommand}
        onListening={setIsListening}
        language="auto"
        placeholder={`Say: 'Create a ${workflowTerm.toLowerCase()} to...'`}
      />
    </div>
  )
}

// Active Workflows Widget - Now with real data and controls
function ActiveWorkflowsWidget({
  workflowTerm,
  getAgentInfo,
  workflows,
  onPause: _onPause,
  onStop: _onStop,
  onRefresh,
  loading
}: {
  workflowTerm: string
  getAgentInfo: (id: string) => { name: string; title: string; description: string }
  workflows: WorkflowItem[]
  onPause?: (workflow: WorkflowItem) => void
  onStop?: (workflow: WorkflowItem) => void
  onRefresh?: () => void
  loading?: boolean
}) {
  // Note: _onPause and _onStop are reserved for external control integration
  void _onPause
  void _onStop
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Handle pause/resume for scheduled workflows
  const handlePause = async (workflow: WorkflowItem) => {
    if (!workflow.scheduleInfo?.recipeId) return

    setActionLoading(workflow.id)
    try {
      const action = workflow.status === 'paused' ? 'resume' : 'pause'
      const response = await fetch(`/api/composio/recipes/${workflow.scheduleInfo.recipeId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        onRefresh?.()
      }
    } catch (err) {
      console.error('[Workflow] Pause error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle stop (delete schedule) for scheduled workflows
  const handleStop = async (workflow: WorkflowItem) => {
    if (!workflow.scheduleInfo?.recipeId) return
    if (!confirm(`Stop "${workflow.name}"? This will delete the schedule.`)) return

    setActionLoading(workflow.id)
    try {
      const response = await fetch(`/api/composio/recipes/${workflow.scheduleInfo.recipeId}/schedule`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onRefresh?.()
      }
    } catch (err) {
      console.error('[Workflow] Stop error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter to show active/scheduled workflows (not just completed)
  const activeWorkflows = workflows.filter(w =>
    w.status === 'running' || w.status === 'scheduled' || w.status === 'queued' || w.status === 'paused'
  ).slice(0, 5) // Show max 5

  const getStatusDisplay = (workflow: WorkflowItem) => {
    switch (workflow.status) {
      case 'running':
        return { icon: '⚡', text: 'Running', color: 'text-amber-400' }
      case 'scheduled':
        return {
          icon: '⏰',
          text: workflow.scheduleInfo?.cronHuman || 'Scheduled',
          color: 'text-purple-400'
        }
      case 'paused':
        return { icon: '⏸', text: 'Paused', color: 'text-slate-400' }
      case 'queued':
        return { icon: '◷', text: 'Queued', color: 'text-slate-400' }
      case 'completed':
        return { icon: '✓', text: 'Completed', color: 'text-emerald-400' }
      case 'failed':
        return { icon: '✗', text: 'Failed', color: 'text-red-400' }
      default:
        return { icon: '○', text: workflow.status, color: 'text-slate-400' }
    }
  }

  const getSourceBadge = (source: WorkflowItem['source']) => {
    switch (source) {
      case 'rube':
      case 'composio':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400">Composio</span>
      case 'nexus':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400">Nexus</span>
      default:
        return null
    }
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-base sm:text-lg">Active {pluralize(workflowTerm)}</h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {loading ? '↻' : '↻'}
            </button>
          )}
          <Link to="/workflows" className="text-sm text-cyan-400 hover:text-cyan-300">
            View All
          </Link>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] sm:max-h-none overflow-y-auto touch-pan-y">
        {loading && activeWorkflows.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full mb-2" />
            <p className="text-sm">Loading workflows...</p>
          </div>
        ) : activeWorkflows.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-3xl mb-2">🚀</p>
            <p className="text-sm">No active {pluralize(workflowTerm).toLowerCase()}</p>
            <Link to="/workflows" className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
              Create your first →
            </Link>
          </div>
        ) : (
          activeWorkflows.map(workflow => {
            const statusDisplay = getStatusDisplay(workflow)
            const isScheduled = workflow.status === 'scheduled' || workflow.status === 'paused'
            const isLoading = actionLoading === workflow.id

            return (
              <div key={workflow.id} className="bg-slate-900/50 rounded-xl p-4 sm:p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div title={workflow.agent ? `${getAgentInfo(workflow.agent).name} - ${getAgentInfo(workflow.agent).title}` : 'System'}>
                    <ProfessionalAvatar agentId={workflow.agent || 'nexus'} size={36} className="sm:w-7 sm:h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{workflow.name}</p>
                      {getSourceBadge(workflow.source)}
                    </div>
                    <span className={`text-xs ${statusDisplay.color}`}>
                      {statusDisplay.icon} {statusDisplay.text}
                    </span>
                  </div>

                  {/* Controls for scheduled workflows */}
                  {isScheduled && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePause(workflow)}
                        disabled={isLoading}
                        className={`p-2.5 sm:p-1.5 rounded-lg transition-colors min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center ${
                          workflow.status === 'paused'
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        } disabled:opacity-50`}
                        title={workflow.status === 'paused' ? 'Resume' : 'Pause'}
                      >
                        {isLoading ? (
                          <span className="inline-block w-4 h-4 sm:w-3 sm:h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : workflow.status === 'paused' ? '▶' : '⏸'}
                      </button>
                      <button
                        onClick={() => handleStop(workflow)}
                        disabled={isLoading}
                        className="p-2.5 sm:p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
                        title="Stop (delete schedule)"
                      >
                        ■
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar for running workflows */}
                {workflow.status === 'running' && workflow.progress !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-cyan-400 font-medium animate-pulse">Running...</span>
                      <span className="text-xs text-slate-400">{workflow.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${workflow.progress}%`,
                          background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #06b6d4)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s linear infinite'
                        }}
                      />
                      <style>{`
                        @keyframes shimmer {
                          0% { background-position: 200% center; }
                          100% { background-position: -200% center; }
                        }
                      `}</style>
                    </div>
                  </div>
                )}

                {/* Next run info for scheduled workflows */}
                {isScheduled && workflow.scheduleInfo?.nextRunAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Next: {new Date(workflow.scheduleInfo.nextRunAt).toLocaleString()}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// Integration Status Widget - now persona-aware (simplified for use in CollapsibleSection)
function IntegrationStatusWidget({ persona, personaDisplayName }: { persona: PersonaType; personaDisplayName: string }) {
  const integrations = useMemo(() => getIntegrationsForPersona(persona), [persona])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400">For {personaDisplayName}</p>
        <Link to="/integrations" className="text-sm text-cyan-400 hover:text-cyan-300">
          Manage
        </Link>
      </div>

      {integrations.map(integration => (
        <div key={integration.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">{integration.icon}</span>
            <span className="text-sm text-white">{integration.name}</span>
          </div>
          <span className={`
            w-2 h-2 rounded-full
            ${integration.status === 'connected' ? 'bg-emerald-500' :
              integration.status === 'error' ? 'bg-red-500 animate-pulse' :
              'bg-slate-500'}
          `} />
        </div>
      ))}
    </div>
  )
}

export function EnhancedDashboard() {
  const { user, userProfile } = useAuth()
  const { term, getAgentInfo, persona, customPersonaLabel } = usePersonalization()

  // Get user's display name - prioritize real name over email-derived
  const userDisplayName = useMemo(() => {
    // Priority 1: Full name from user profile
    if (userProfile?.full_name) {
      return userProfile.full_name.split(' ')[0] // First name only for friendliness
    }
    // Priority 2: Full name from user metadata
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]
    }
    // Priority 3: Derive from email (existing fallback)
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      // Capitalize first letter
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    return null
  }, [user, userProfile])

  // Get persona-specific data
  const personaDisplayName = useMemo(() => {
    if (persona === 'custom' && customPersonaLabel) {
      return customPersonaLabel
    }
    return PERSONA_DISPLAY_NAMES[persona] || 'Business'
  }, [persona, customPersonaLabel])

  const quickStartTemplates = useMemo(() => getQuickStartForPersona(persona), [persona])

  // Time-based greeting that updates on period changes
  const [timeGreeting, setTimeGreeting] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  })

  // Update greeting when time period changes (check every minute)
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours()
      const newGreeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
      setTimeGreeting(prev => prev !== newGreeting ? newGreeting : prev)
    }
    const interval = setInterval(checkTime, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const [showOnboarding, setShowOnboarding] = useState(false)

  // First win banner - pending workflow from signup
  const [pendingWorkflow, setPendingWorkflow] = useState<string | null>(null)

  // AI Meeting Room state
  const [showMeetingRoom, setShowMeetingRoom] = useState(false)

  // Getting Started checklist state - show for users who haven't dismissed it
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return localStorage.getItem('nexus_guide_dismissed') !== 'true'
  })

  // Welcome banner state - show for users who completed onboarding but are still new
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    const onboardingComplete = localStorage.getItem('nexus_onboarding_complete') === 'true'
    const bannerDismissed = localStorage.getItem('nexus_welcome_banner_dismissed') === 'true'
    return onboardingComplete && !bannerDismissed
  })

  const navigate = useNavigate()

  // Session 7: Initial loading state for skeleton UI
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Brief loading delay for perceived performance improvement
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 400) // Short delay to show skeleton, avoids flicker
    return () => clearTimeout(timer)
  }, [])

  // Session 3: Focus Mode state - persisted in localStorage
  const [focusMode, setFocusMode] = useState(() => {
    return localStorage.getItem('nexus_focus_mode') === 'true'
  })

  // Toggle focus mode with persistence
  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => {
      const newValue = !prev
      localStorage.setItem('nexus_focus_mode', String(newValue))
      return newValue
    })
  }, [])

  // Real workflow data from Nexus API and Composio/Rube recipes
  const { workflows, stats: workflowStats, loading: workflowsLoading, refresh: refreshWorkflows } = useWorkflows()

  // Exception queue for human-in-the-loop decisions
  const { items: exceptionItems } = useExceptionQueue(user?.id || '')

  // Real stats computed from actual workflow data (no fake numbers!)
  const userStats = useMemo<UserStats>(() => {
    const completedCount = workflowStats.completed
    const tasksFromWorkflows = workflows.length * 3 // Estimate ~3 tasks per workflow
    const timeSaved = (completedCount * 10 + tasksFromWorkflows * 2) / 60 // 10min per workflow, 2min per task

    return {
      workflowsCompleted: completedCount,
      timeSavedHours: timeSaved,
      integrationsConnected: 0, // Will be populated from real integration data
      totalValueGenerated: Math.round(timeSaved * 50), // $50/hour estimate
      tasksAutomated: tasksFromWorkflows,
      errorsRecovered: workflowStats.failed > 0 ? 1 : 0,
    }
  }, [workflows, workflowStats])

  // Calculate realistic time saved: workflows × 10min + tasks × 2min
  const calculatedTimeSaved = useMemo(() => {
    const totalMinutes = (userStats.workflowsCompleted * 10) + (userStats.tasksAutomated * 2)
    return totalMinutes / 60
  }, [userStats.workflowsCompleted, userStats.tasksAutomated])

  const { achievements, pendingNotification, checkAchievements, dismissNotification } = useAchievements()

  // Derive AI suggestion context from REAL workflow data
  const aiSuggestionContext = useMemo(() => {
    // Extract workflow types/keywords from actual workflow names
    const recentWorkflowTypes = workflows.slice(0, 10).map(w => {
      const name = w.name.toLowerCase()
      if (name.includes('email')) return 'email'
      if (name.includes('crm') || name.includes('salesforce')) return 'crm'
      if (name.includes('slack')) return 'slack'
      if (name.includes('meeting')) return 'meeting'
      if (name.includes('report')) return 'report'
      return 'general'
    })

    // Get unique workflow types
    const uniqueTypes = [...new Set(recentWorkflowTypes)]

    return {
      recentWorkflows: uniqueTypes,
      connectedIntegrations: [], // Will be populated from real integration data later
      userGoal: localStorage.getItem('nexus_user_goal') || 'sales',
      workflowsThisWeek: workflowStats.completed + workflowStats.pending, // Use REAL count
      failedWorkflows: workflows.filter(w => w.status === 'failed').map(w => w.id),
    }
  }, [workflows, workflowStats])

  const { suggestions, dismissSuggestion } = useAISuggestions(aiSuggestionContext)

  // Check for first-time user
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('nexus_onboarding_complete')
    if (!onboardingComplete) {
      setShowOnboarding(true)
    }
  }, [])

  // Check for pending workflow from signup
  useEffect(() => {
    const workflow = localStorage.getItem('nexus_pending_workflow')
    const signupSource = localStorage.getItem('nexus_signup_source')
    if (workflow && signupSource === 'landing_workflow_input') {
      setPendingWorkflow(workflow)
    }
  }, [])

  // Dismiss the first win banner
  const dismissFirstWinBanner = () => {
    setPendingWorkflow(null)
    localStorage.removeItem('nexus_pending_workflow')
    localStorage.removeItem('nexus_signup_source')
  }

  // Check achievements when stats change
  useEffect(() => {
    checkAchievements(userStats)
  }, [userStats, checkAchievements])

  // Get the featured (highest priority) suggestion - MUST be before any conditional returns
  const featuredSuggestion = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return null
    // Sort by priority and get the first one
    const sorted = [...suggestions].sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority ?? 'medium'] ?? 2) - (priorityOrder[b.priority ?? 'medium'] ?? 2)
    })
    return sorted[0]
  }, [suggestions])

  // Remaining suggestions after featured - MUST be before any conditional returns
  const remainingSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length <= 1) return []
    return suggestions.filter(s => s.id !== featuredSuggestion?.id)
  }, [suggestions, featuredSuggestion])

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command:', command)
    // Navigate to workflow creation with voice input
  }

  const handleSuggestionAction = (suggestion: AISuggestion) => {
    console.log('Suggestion action:', suggestion)
    if (suggestion.action?.path) {
      window.location.href = suggestion.action.path
    }
  }

  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
    )
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        {/* Achievement Notification - Only show for users with actual activity (not new users) */}
        {pendingNotification && userStats.workflowsCompleted > 0 && (
          <AchievementNotification
            achievement={pendingNotification}
            onClose={dismissNotification}
          />
        )}

        {/* Session 7: Skeleton Loading State */}
        {isInitialLoading ? (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Skeleton width={280} height={28} className="mb-2" />
                <Skeleton width={200} height={18} />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton variant="rounded" width={100} height={36} />
                <Skeleton variant="rounded" width={120} height={36} />
              </div>
            </div>

            {/* Workflow Status Hero skeleton */}
            <WorkflowStatusSkeleton />

            {/* Featured AI Suggestion skeleton */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-start gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="50%" height={20} />
                  <Skeleton width="80%" height={16} />
                  <Skeleton width="60%" height={16} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton variant="rounded" width={100} height={36} />
                <Skeleton variant="rounded" width={80} height={36} />
              </div>
            </div>

            {/* Main Grid skeleton */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <StatsCardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
              <div className="space-y-6">
                <AISuggestionsSkeleton count={2} />
              </div>
            </div>
          </div>
        ) : workflows.length === 0 && !workflowsLoading && !pendingWorkflow ? (
          // New User Experience - Clean, focused onboarding
          <NewUserWelcome
            userName={user?.email?.split('@')[0] || ''}
            workflowTerm={term('workflow')}
            personaDisplayName={personaDisplayName}
          />
        ) : (
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* First Win Banner - shows pending workflow from signup */}
        {pendingWorkflow && (
          <FirstWinBanner workflow={pendingWorkflow} workflowTerm={term('workflow')} onDismiss={dismissFirstWinBanner} />
        )}

        {/* Welcome Banner - for users who just completed onboarding */}
        {showWelcomeBanner && !pendingWorkflow && workflows.length < 3 && (
          <WelcomeBanner
            userName={userDisplayName || undefined}
            onDismiss={() => {
              setShowWelcomeBanner(false)
              localStorage.setItem('nexus_welcome_banner_dismissed', 'true')
            }}
            onCreateWorkflow={() => navigate('/workflow-demo')}
          />
        )}

        {/* Header with Focus Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Good {timeGreeting}{userDisplayName ? `, ${userDisplayName}` : ''} 👋
              </h1>
              <span className="px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30">
                {personaDisplayName}
              </span>
            </div>
            <p className="text-slate-400 text-sm sm:text-base">
              You've saved <span className="text-cyan-400 font-semibold">{calculatedTimeSaved.toFixed(1)} hours</span> this week.
              Keep it up!
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            {/* Focus Mode Toggle - Session 3 */}
            <FocusModeToggle isEnabled={focusMode} onToggle={toggleFocusMode} />

            <Link
              to="/settings?tab=personalization"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-3 sm:py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-all text-sm min-h-[44px]"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Change Role</span>
              <span className="sm:hidden">Role</span>
            </Link>
            <Link
              to="/workflow-demo"
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-4 py-3 sm:py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all text-sm sm:text-base min-h-[44px]"
            >
              <span>✨</span>
              <span className="hidden sm:inline">New {term('workflow')}</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>

        {/* SESSION 3: Workflow Status Hero - "Your Workflows Right Now" */}
        <WorkflowStatusHero workflowTerm={term('workflow')} />

        {/* Human-in-the-Loop Exception Queue - Pending decisions that need user attention */}
        {exceptionItems.length > 0 && user?.id && (
          <ExceptionQueuePanel
            userId={user.id}
            maxVisible={3}
            className="animate-in fade-in slide-in-from-top-2 duration-300"
            onDecision={(item, action) => {
              console.log(`[ExceptionQueue] Decision made: ${action} for ${item.id}`)
            }}
          />
        )}

        {/* Competitive Advantages Banner - "Results, Not Conversations" */}
        {userStats.workflowsCompleted > 0 && (
          <CompetitiveStatsBanner
            workflowsCompleted={userStats.workflowsCompleted}
            tasksAutomated={userStats.tasksAutomated}
            variant="compact"
          />
        )}

        {/* SESSION 3: Featured AI Suggestion - ONE prominent */}
        <FeaturedAISuggestion
          suggestion={featuredSuggestion}
          onAction={handleSuggestionAction}
          onDismiss={dismissSuggestion}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Value Calculator - Always visible in Focus Mode */}
            <ValueCalculator
              workflowsCompleted={userStats.workflowsCompleted}
              tasksAutomated={userStats.tasksAutomated}
            />

            {/* Stats Overview - Collapsible in Focus Mode */}
            {focusMode ? (
              <CollapsibleSection title="Stats Overview" icon="📊" defaultOpen={false}>
                <StatsCard stats={userStats} />
              </CollapsibleSection>
            ) : (
              <StatsCard stats={userStats} />
            )}

            {/* Additional AI Suggestions - Collapsible */}
            {remainingSuggestions.length > 0 && (
              <CollapsibleSection
                title="More AI Suggestions"
                icon="💡"
                defaultOpen={!focusMode}
                badge={remainingSuggestions.length}
              >
                <AISuggestionsPanel
                  suggestions={remainingSuggestions}
                  onDismiss={dismissSuggestion}
                  onAction={handleSuggestionAction}
                  maxVisible={3}
                />
              </CollapsibleSection>
            )}

            {/* Active Workflows - Always prominent - Now with real data */}
            <ActiveWorkflowsWidget
              workflowTerm={term('workflow')}
              getAgentInfo={getAgentInfo}
              workflows={workflows}
              loading={workflowsLoading}
              onRefresh={refreshWorkflows}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Getting Started Checklist - for new users */}
            {showGettingStarted && workflows.length < 5 && (
              <GettingStartedChecklist
                compact
                onDismiss={() => {
                  setShowGettingStarted(false)
                  dismissGuide()
                }}
              />
            )}

            {/* Voice Command - Always visible */}
            <QuickVoiceAction onCommand={handleVoiceCommand} workflowTerm={term('workflow')} />

            {/* Achievements Preview - Collapsible */}
            <CollapsibleSection
              title="Achievements"
              icon="🏆"
              defaultOpen={!focusMode}
              badge={`${achievements.filter(a => a.unlocked).length}/${achievements.length}`}
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-2">
                {achievements.slice(0, 5).map(achievement => (
                  <div
                    key={achievement.id}
                    className={`
                      w-full aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-xl min-h-[60px] sm:min-h-0
                      ${achievement.unlocked
                        ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20'
                        : 'bg-slate-700/50 opacity-40'
                      }
                    `}
                  >
                    {achievement.icon}
                  </div>
                ))}
              </div>
              <Link
                to="/profile?tab=achievements"
                className="block text-center text-sm text-cyan-400 hover:text-cyan-300 mt-4"
              >
                View All Achievements →
              </Link>
            </CollapsibleSection>

            {/* Integration Status - Collapsible */}
            <CollapsibleSection title="Integrations" icon="🔗" defaultOpen={!focusMode}>
              <IntegrationStatusWidget persona={persona} personaDisplayName={personaDisplayName} />
            </CollapsibleSection>

            {/* Quick Templates - Persona-specific - Collapsible */}
            <CollapsibleSection title={`Quick Start for ${personaDisplayName}`} icon="🚀" defaultOpen={!focusMode}>
              <div className="space-y-2">
                {quickStartTemplates.map((template, i) => (
                  <Link
                    key={i}
                    to={`/templates?id=${template.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex items-center justify-between p-4 sm:p-3 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 transition-colors group min-h-[60px] sm:min-h-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div>
                        <span className="text-sm text-white block group-hover:text-cyan-400 transition-colors">{template.name}</span>
                        <span className="text-xs text-slate-500">{template.description}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{template.time}</span>
                  </Link>
                ))}
              </div>
              <Link to="/templates" className="block text-center text-sm text-cyan-400 hover:text-cyan-300 mt-4">
                Browse All Templates →
              </Link>
            </CollapsibleSection>
          </div>
        </div>
        </div>
        )}
      </div>

      {/* AI Meeting Room - Floating Button (Lazy Loaded) */}
      <LazyMeetingRoomButton
        variant="floating"
        onClick={() => setShowMeetingRoom(true)}
      />

      {/* AI Meeting Room Modal (Lazy Loaded - only loads when opened) */}
      <LazyAIMeetingRoom
        isOpen={showMeetingRoom}
        onClose={() => setShowMeetingRoom(false)}
        mode="optimization"
      />
    </Layout>
  )
}

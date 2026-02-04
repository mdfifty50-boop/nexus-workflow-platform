import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Clock,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Play,
  MoreHorizontal,
  Award,
  Flame,
  Target,
  Trophy,
  Star,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Plus,
} from 'lucide-react'
import clsx from 'clsx'
import { RegionalIntelligenceService } from '@/services/RegionalIntelligenceService'
import { ProactiveSuggestionsService, type ProactiveSuggestion } from '@/services/ProactiveSuggestionsService'
import { IntegrationDiscoveryService } from '@/services/IntegrationDiscoveryService'
import { workflowPersistenceService, type SavedWorkflow } from '@/services/WorkflowPersistenceService'
import { DailyAdviceCard } from '@/components/DailyAdviceCard'
// @NEXUS-FIX-090: Role-based avatar integration
import { SmartAvatar } from '@/components/Avatar'

// ============================================
// SERVICE INTEGRATION: Dashboard Intelligence
// Replaces hardcoded data with service-managed context
// ============================================

// User's region (would come from user settings in production)
const USER_REGION = 'kuwait'

// Icon mapping for suggestion types
const SUGGESTION_ICONS: Record<string, typeof Zap> = {
  workflow: Zap,
  integration: Lightbulb,
  optimization: RefreshCw,
  schedule: Clock,
  template: Sparkles,
}

// Convert ProactiveSuggestion to dashboard display format
interface DashboardSuggestion {
  id: string
  title: string
  description: string
  impact: 'High' | 'Medium' | 'Low'
  icon: typeof Zap
}

function convertToDisplaySuggestion(suggestion: ProactiveSuggestion): DashboardSuggestion {
  const impactMap: Record<'high' | 'medium' | 'low', 'High' | 'Medium' | 'Low'> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }

  return {
    id: suggestion.id,
    title: suggestion.title,
    description: suggestion.description,
    impact: impactMap[suggestion.priority],
    icon: SUGGESTION_ICONS[suggestion.type] || Lightbulb,
  }
}

const stats = [
  {
    name: 'Total Workflows',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    link: '/workflows',
  },
  {
    name: 'Executions Today',
    value: '1,234',
    change: '+28%',
    trend: 'up',
    icon: Play,
    color: 'from-purple-500 to-pink-500',
    link: '/workflows',
  },
  {
    name: 'Time Saved',
    value: '48h',
    change: '+15%',
    trend: 'up',
    icon: Clock,
    color: 'from-emerald-500 to-teal-500',
    link: '/profile',
  },
  {
    name: 'Success Rate',
    value: '99.2%',
    change: '-0.3%',
    trend: 'down',
    icon: CheckCircle2,
    color: 'from-orange-500 to-red-500',
    link: '/workflows',
  },
]

// Display format for recent workflows (unified for persisted + fallback)
interface DisplayWorkflow {
  id: string
  name: string
  lastRun: string
  status: 'active' | 'paused' | 'draft' | 'completed' | 'failed'
  runs: number
  icon: string
}

// Convert SavedWorkflow to display format
function convertToDisplayWorkflow(workflow: SavedWorkflow): DisplayWorkflow {
  // Map status to display values
  const statusMap: Record<string, 'active' | 'paused' | 'draft' | 'completed' | 'failed'> = {
    active: 'active',
    paused: 'paused',
    draft: 'draft',
    completed: 'completed',
    failed: 'failed',
    archived: 'paused', // Show archived as paused for display
  }

  return {
    id: workflow.id,
    name: workflow.name,
    lastRun: formatRelativeTime(workflow.lastExecutedAt),
    status: statusMap[workflow.status] || 'draft',
    runs: workflow.executionCount || 0,
    icon: getWorkflowIcon(workflow),
  }
}

const achievements = [
  {
    id: 1,
    name: 'Automation Expert',
    description: 'Created 20+ workflows',
    icon: Trophy,
    progress: 100,
    earned: true,
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 2,
    name: 'Time Saver',
    description: 'Saved 100+ hours',
    icon: Clock,
    progress: 72,
    earned: false,
    color: 'from-blue-400 to-cyan-500',
  },
  {
    id: 3,
    name: 'Streak Master',
    description: '30-day active streak',
    icon: Flame,
    progress: 85,
    earned: false,
    color: 'from-red-400 to-orange-500',
  },
  {
    id: 4,
    name: 'Integration Pro',
    description: 'Connect 10+ apps',
    icon: Target,
    progress: 100,
    earned: true,
    color: 'from-purple-400 to-pink-500',
  },
]

// Fallback suggestions (used when service returns empty)
const fallbackSuggestions: DashboardSuggestion[] = [
  {
    id: 'fallback-1',
    title: 'Optimize Email Workflow',
    description: 'Your email workflow could run 40% faster with batch processing.',
    impact: 'High',
    icon: Zap,
  },
  {
    id: 'fallback-2',
    title: 'New Integration Available',
    description: 'Google Sheets can now sync with your CRM automatically.',
    impact: 'Medium',
    icon: Lightbulb,
  },
  {
    id: 'fallback-3',
    title: 'Weekly Summary Report',
    description: 'Set up automated weekly reports for your team.',
    impact: 'Low',
    icon: RefreshCw,
  },
]

// Helper: Format relative time for "last run" display
function formatRelativeTime(date: Date | undefined): string {
  if (!date) return 'Never run'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

// Helper: Get icon for workflow based on integrations
function getWorkflowIcon(workflow: SavedWorkflow): string {
  const integration = workflow.requiredIntegrations?.[0] || workflow.triggerConfig?.integration || ''

  const iconMap: Record<string, string> = {
    gmail: '📧',
    email: '📧',
    slack: '💬',
    googlesheets: '📊',
    sheets: '📊',
    dropbox: '📁',
    drive: '📁',
    googledrive: '📁',
    notion: '📝',
    calendar: '📅',
    googlecalendar: '📅',
    twitter: '🐦',
    linkedin: '💼',
    github: '🐙',
    stripe: '💳',
    whatsapp: '📱',
    discord: '🎮',
    zoom: '📹',
    hubspot: '🎯',
    salesforce: '☁️',
    trello: '📋',
    asana: '✅',
  }

  return iconMap[integration.toLowerCase()] || '⚡'
}

// Fallback workflows when no data exists (demo purposes)
const fallbackWorkflows = [
  {
    id: 'demo-1',
    name: 'Email to Slack Notifier',
    lastRun: '2 minutes ago',
    status: 'active' as const,
    runs: 156,
    icon: '📧',
  },
  {
    id: 'demo-2',
    name: 'Lead Scoring Pipeline',
    lastRun: '15 minutes ago',
    status: 'active' as const,
    runs: 89,
    icon: '🎯',
  },
  {
    id: 'demo-3',
    name: 'Invoice Generator',
    lastRun: '1 hour ago',
    status: 'paused' as const,
    runs: 45,
    icon: '📄',
  },
  {
    id: 'demo-4',
    name: 'Social Media Scheduler',
    lastRun: '3 hours ago',
    status: 'active' as const,
    runs: 234,
    icon: '📱',
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

export function Dashboard() {
  // ============================================
  // SERVICE-BASED DATA (Regional + AI Intelligence)
  // ============================================

  // Daily advice visibility (component handles its own dismiss state)
  const showDailyAdvice = true

  // User context for daily advice (would come from actual user data in production)
  const dailyAdviceUserContext = useMemo(() => ({
    connectedIntegrations: ['gmail', 'slack', 'googlesheets'],
    recentWorkflows: [],
    region: USER_REGION,
    businessType: 'saas' as const,
    teamSize: 'small' as const,
  }), [])

  // Get regional greeting context
  const greetingContext = useMemo(() => {
    const regional = RegionalIntelligenceService.getContext(USER_REGION)
    const isBusinessHours = RegionalIntelligenceService.isBusinessHours(USER_REGION)
    const dayType = RegionalIntelligenceService.getDayType(USER_REGION)

    // Time-based greeting
    const hour = new Date().getHours()
    let timeGreeting = 'Good day'
    if (hour < 12) timeGreeting = 'Good morning'
    else if (hour < 17) timeGreeting = 'Good afternoon'
    else timeGreeting = 'Good evening'

    // Contextual subtitle
    let subtitle = "Here's what's happening with your workflows today."
    if (dayType === 'friday' && regional.region === 'GCC') {
      subtitle = "It's Friday – a quiet day. Review your upcoming week's automations."
    } else if (!isBusinessHours) {
      subtitle = 'Working late? Your automations are running smoothly.'
    } else if (dayType === 'weekend') {
      subtitle = 'Taking some time to plan? Your workflows are ready when you are.'
    }

    return { timeGreeting, subtitle, isBusinessHours, regional }
  }, [])

  // ==========================================================================
  // RECENT WORKFLOWS - Phase 3: WorkflowPersistenceService Integration
  // ==========================================================================

  const [recentWorkflows, setRecentWorkflows] = useState<DisplayWorkflow[]>(fallbackWorkflows)
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true)

  useEffect(() => {
    async function loadWorkflows() {
      try {
        setIsLoadingWorkflows(true)
        const { workflows } = await workflowPersistenceService.loadWorkflows()

        if (workflows && workflows.length > 0) {
          // Get active (non-archived) workflows, sorted by most recently updated
          const activeWorkflows = workflows
            .filter(w => w.status !== 'archived')
            .slice(0, 4) // Show top 4 on dashboard
            .map(convertToDisplayWorkflow)

          setRecentWorkflows(activeWorkflows)
        } else {
          // No saved workflows - show fallback demos
          setRecentWorkflows(fallbackWorkflows)
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to load workflows:', err)
        setRecentWorkflows(fallbackWorkflows)
      } finally {
        setIsLoadingWorkflows(false)
      }
    }

    loadWorkflows()
  }, [])

  // Get AI-powered suggestions from ProactiveSuggestionsService
  const aiSuggestions = useMemo(() => {
    // Mock user context (would come from actual user data in production)
    const userContext = {
      connectedIntegrations: ['gmail', 'slack', 'googlesheets'],
      recentWorkflows: [],
      region: USER_REGION,
      businessType: 'saas' as const,
    }

    const serviceSuggestions = ProactiveSuggestionsService.getSuggestions(userContext)

    if (serviceSuggestions.length === 0) {
      return fallbackSuggestions
    }

    return serviceSuggestions.slice(0, 3).map(convertToDisplaySuggestion)
  }, [])

  // Get integration recommendations
  const integrationRecommendations = useMemo(() => {
    const profile = {
      type: 'saas',
      region: USER_REGION,
      teamSize: 'small' as const,
      primaryLanguage: 'english',
      existingIntegrations: ['gmail', 'slack', 'googlesheets'],
    }

    const suggestions = IntegrationDiscoveryService.getSuggestions(profile)
    return suggestions.slice(0, 3)
  }, [])

  return (
    <div className="space-y-8">
      {/* Page header with Avatar - @NEXUS-FIX-090 */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {/* Smart Avatar - auto-detects user role */}
          <motion.div variants={fadeInUp}>
            <SmartAvatar
              size="lg"
              state="idle"
              userIndustry="business"
              showName={false}
              showTitle={false}
            />
          </motion.div>
          <div>
            <motion.h1 variants={fadeInUp} className="text-3xl font-bold text-white">
              {greetingContext.timeGreeting}, John
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-surface-400 mt-1">
              {greetingContext.subtitle}
            </motion.p>
          </div>
        </div>
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-400">All systems operational</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Daily AI Workflow Advice - Featured Tip of the Day */}
      {showDailyAdvice && (
        <DailyAdviceCard
          userContext={dailyAdviceUserContext}
          personaType="sme"
          className="w-full"
        />
      )}

      {/* Nexus Chat Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link to="/chat">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nexus-600 via-nexus-500 to-accent-500 p-1 group cursor-pointer">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-nexus-400 via-accent-400 to-nexus-400 opacity-0 group-hover:opacity-100 transition-opacity animate-gradient-x" />

            <div className="relative bg-surface-900/95 rounded-xl p-6 md:p-8 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left content */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      Nexus Chat
                      <span className="px-2 py-0.5 text-xs font-medium bg-nexus-500/20 text-nexus-300 rounded-full">AI-Powered</span>
                    </h2>
                    <p className="text-surface-300 text-sm md:text-base max-w-xl">
                      Describe any workflow in plain English and watch Nexus build it for you instantly.
                      Connect 500+ apps with zero code.
                    </p>
                  </div>
                </div>

                {/* Right CTA button */}
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-nexus-500 to-accent-500 text-white font-semibold group-hover:shadow-lg group-hover:shadow-nexus-500/30 transition-all">
                    <Sparkles className="w-5 h-5" />
                    <span>Start Building</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Example prompts */}
              <div className="mt-6 pt-6 border-t border-surface-700/50">
                <p className="text-xs text-surface-500 mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {['Send me an email digest every morning', 'Alert me on Slack when a lead scores high', 'Sync my calendar to Notion'].map((prompt, i) => (
                    <span key={i} className="px-3 py-1.5 text-sm bg-surface-800/80 text-surface-300 rounded-lg border border-surface-700/50 hover:border-nexus-500/30 transition-colors">
                      "{prompt}"
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="stat-card group cursor-pointer"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl`} />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-surface-400 mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className={clsx(
                    'flex items-center gap-1 text-sm font-medium',
                    stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                  <span className="text-xs text-surface-500">vs last week</span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent workflows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Workflows</h2>
            <Link to="/workflows" className="text-sm text-nexus-400 hover:text-nexus-300 transition-colors flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoadingWorkflows ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-surface-700/50" />
                    <div className="flex-1">
                      <div className="h-4 bg-surface-700/50 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-surface-700/30 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </>
            ) : recentWorkflows.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-xl bg-surface-800/50 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-surface-500" />
                </div>
                <p className="text-surface-400 mb-2">No workflows yet</p>
                <Link to="/chat" className="text-nexus-400 hover:text-nexus-300 text-sm">
                  Create your first workflow →
                </Link>
              </div>
            ) : (
              // Workflow list
              recentWorkflows.map((workflow) => (
                <Link key={workflow.id} to="/workflows">
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-transparent hover:border-surface-700 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface-700/50 flex items-center justify-center text-2xl">
                      {workflow.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{workflow.name}</p>
                      <p className="text-sm text-surface-400">{workflow.runs} runs · {workflow.lastRun}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        'badge',
                        workflow.status === 'active' ? 'badge-success' :
                        workflow.status === 'completed' ? 'badge-success' :
                        workflow.status === 'failed' ? 'badge-error' :
                        'badge-warning'
                      )}>
                        {workflow.status}
                      </span>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-700 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4 text-surface-400" />
                      </button>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Suggestions</h2>
          </div>

          <div className="space-y-4">
            {aiSuggestions.map((suggestion) => {
              const IconComponent = suggestion.icon
              return (
                <Link key={suggestion.id} to="/chat">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-nexus-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-nexus-500/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-nexus-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white text-sm">{suggestion.title}</p>
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full',
                            suggestion.impact === 'High' && 'bg-red-500/20 text-red-400',
                            suggestion.impact === 'Medium' && 'bg-amber-500/20 text-amber-400',
                            suggestion.impact === 'Low' && 'bg-blue-500/20 text-blue-400'
                          )}>
                            {suggestion.impact}
                          </span>
                        </div>
                        <p className="text-sm text-surface-400 leading-relaxed">{suggestion.description}</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          <Link to="/chat" className="block w-full mt-4 py-3 rounded-xl border border-dashed border-surface-600 text-surface-400 hover:border-nexus-500/50 hover:text-nexus-400 transition-all text-sm text-center">
            View more suggestions
          </Link>
        </motion.div>
      </div>

      {/* Achievements section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Achievements</h2>
          </div>
          <span className="text-sm text-surface-400">2 of 4 earned</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <Link key={achievement.id} to="/profile">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={clsx(
                  'relative p-5 rounded-xl border transition-all cursor-pointer overflow-hidden h-full',
                  achievement.earned
                    ? 'bg-gradient-to-br from-surface-800 to-surface-900 border-amber-500/30'
                    : 'bg-surface-800/50 border-surface-700/50 hover:border-surface-600'
                )}
              >
                {/* Glow effect for earned */}
                {achievement.earned && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                )}

                <div className="relative">
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    achievement.earned
                      ? `bg-gradient-to-br ${achievement.color}`
                      : 'bg-surface-700/50'
                  )}>
                    <achievement.icon className={clsx(
                      'w-6 h-6',
                      achievement.earned ? 'text-white' : 'text-surface-400'
                    )} />
                  </div>

                  <h3 className="font-medium text-white mb-1">{achievement.name}</h3>
                  <p className="text-sm text-surface-400 mb-3">{achievement.description}</p>

                  {/* Progress bar */}
                  {!achievement.earned && (
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-surface-500">Progress</span>
                        <span className="text-surface-400">{achievement.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full bg-gradient-to-r ${achievement.color} rounded-full`}
                        />
                      </div>
                    </div>
                  )}

                  {achievement.earned && (
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      <span>Earned!</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recommended Integrations - powered by IntegrationDiscoveryService */}
      {integrationRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6 text-nexus-400" />
              <h2 className="text-lg font-semibold text-white">Recommended Integrations</h2>
            </div>
            <Link to="/integrations" className="text-sm text-nexus-400 hover:text-nexus-300 transition-colors flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {integrationRecommendations.map((integration) => (
              <Link key={integration.toolkit} to={`/integrations?app=${integration.toolkit}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-nexus-500/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nexus-500/20 to-accent-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-nexus-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{integration.name}</p>
                      <p className="text-xs text-surface-500">{integration.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-400 mb-3 line-clamp-2">{integration.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full',
                      integration.priority === 'high' && 'bg-emerald-500/20 text-emerald-400',
                      integration.priority === 'medium' && 'bg-amber-500/20 text-amber-400',
                      integration.priority === 'low' && 'bg-blue-500/20 text-blue-400'
                    )}>
                      {integration.priority} priority
                    </span>
                    <span className="text-xs text-surface-500">
                      Saves {integration.estimatedValue}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

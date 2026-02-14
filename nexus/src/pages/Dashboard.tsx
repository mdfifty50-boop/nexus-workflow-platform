import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
import { userMemoryService } from '@/services/UserMemoryService'
import { workflowPersistenceService, type SavedWorkflow } from '@/services/WorkflowPersistenceService'
import { useAuth } from '@/contexts/AuthContext'
// @NEXUS-FIX-090: Role-based avatar integration (SmartAvatar kept as fallback)
import { Spline3DAvatar } from '@/components/Spline3DAvatar'
import { NEXUS_AGENTS } from '@/lib/nexus-party-mode-service'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

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

// Compute stats dynamically from real workflow data
function computeStats(workflows: DisplayWorkflow[]) {
  const totalWorkflows = workflows.filter(w => !w.id.startsWith('demo-')).length
  const totalRuns = workflows
    .filter(w => !w.id.startsWith('demo-'))
    .reduce((sum, w) => sum + (w.runs || 0), 0)
  const timeSavedHours = Math.round(totalWorkflows * 0.5) // ~30 min per workflow
  const successCount = workflows.filter(w => !w.id.startsWith('demo-') && (w.status === 'active' || w.status === 'completed')).length
  const successRate = totalWorkflows > 0
    ? ((successCount / totalWorkflows) * 100).toFixed(1) + '%'
    : 'N/A'

  return [
    {
      name: 'Total Workflows',
      value: String(totalWorkflows),
      change: totalWorkflows > 0 ? '+' + totalWorkflows : '—',
      trend: 'up' as const,
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      link: '/workflows',
    },
    {
      name: 'Executions',
      value: totalRuns.toLocaleString(),
      change: totalRuns > 0 ? '+' + totalRuns : '—',
      trend: 'up' as const,
      icon: Play,
      color: 'from-purple-500 to-pink-500',
      link: '/workflows',
    },
    {
      name: 'Time Saved',
      value: timeSavedHours > 0 ? timeSavedHours + 'h' : '0h',
      change: timeSavedHours > 0 ? '+' + timeSavedHours + 'h' : '—',
      trend: 'up' as const,
      icon: Clock,
      color: 'from-emerald-500 to-teal-500',
      link: '/profile',
    },
    {
      name: 'Success Rate',
      value: successRate,
      change: successRate !== 'N/A' ? successRate : '—',
      trend: (successCount / Math.max(totalWorkflows, 1)) >= 0.5 ? 'up' as const : 'down' as const,
      icon: CheckCircle2,
      color: 'from-orange-500 to-red-500',
      link: '/workflows',
    },
  ]
}

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

// Compute achievements from real workflow data
function computeAchievements(workflows: DisplayWorkflow[]) {
  const realCount = workflows.filter(w => !w.id.startsWith('demo-')).length
  const totalRuns = workflows
    .filter(w => !w.id.startsWith('demo-'))
    .reduce((sum, w) => sum + (w.runs || 0), 0)
  const timeSaved = Math.round(realCount * 0.5)

  return [
    {
      id: 1,
      name: 'Automation Expert',
      description: 'Created 20+ workflows',
      icon: Trophy,
      progress: Math.min(100, Math.round((realCount / 20) * 100)),
      earned: realCount >= 20,
      color: 'from-amber-400 to-orange-500',
    },
    {
      id: 2,
      name: 'Time Saver',
      description: 'Saved 100+ hours',
      icon: Clock,
      progress: Math.min(100, Math.round((timeSaved / 100) * 100)),
      earned: timeSaved >= 100,
      color: 'from-blue-400 to-cyan-500',
    },
    {
      id: 3,
      name: 'Execution Pro',
      description: '1,000+ workflow runs',
      icon: Flame,
      progress: Math.min(100, Math.round((totalRuns / 1000) * 100)),
      earned: totalRuns >= 1000,
      color: 'from-red-400 to-orange-500',
    },
    {
      id: 4,
      name: 'Integration Pro',
      description: 'Connect 10+ apps',
      icon: Target,
      progress: 0,
      earned: false,
      color: 'from-purple-400 to-pink-500',
    },
  ]
}

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

  const { t } = useTranslation()
  const { userProfile, user } = useAuth()
  const userName = userProfile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || null

  const { industryName, hasProfile } = useBusinessProfile()

  // AI Consultancy agents for the agency card
  const consultants = useMemo(() => Object.values(NEXUS_AGENTS).slice(0, 8), [])

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

  const [recentWorkflows, setRecentWorkflows] = useState<DisplayWorkflow[]>([])
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
          // No saved workflows - show empty state
          setRecentWorkflows([])
        }
      } catch (err) {
        console.warn('[Dashboard] Failed to load workflows:', err)
        setRecentWorkflows([])
      } finally {
        setIsLoadingWorkflows(false)
      }
    }

    loadWorkflows()
  }, [])

  // Compute stats and achievements from real data
  const stats = useMemo(() => computeStats(recentWorkflows), [recentWorkflows])
  const achievements = useMemo(() => computeAchievements(recentWorkflows), [recentWorkflows])
  const earnedCount = achievements.filter(a => a.earned).length

  // Get AI-powered suggestions from ProactiveSuggestionsService
  const aiSuggestions = useMemo(() => {
    // Build real user context from persistent memory
    const memory = userMemoryService.buildMemoryProfile()
    const userContext = {
      connectedIntegrations: memory.topIntegrations.length > 0 ? memory.topIntegrations : ['gmail', 'slack', 'googlesheets'],
      recentWorkflows: memory.recentWorkflowNames,
      region: memory.region || USER_REGION,
      businessType: (memory.industry?.toLowerCase() || 'saas') as 'saas',
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

  // Color class for stat cards
  const statColorClass = ['stat-blue', 'stat-purple', 'stat-emerald', 'stat-orange']

  return (
    <div className="space-y-8">
      {/* Page header with Avatar - @NEXUS-FIX-090 */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-5">
          {/* 3D Interactive Robot Avatar */}
          <motion.div variants={fadeInUp} className="flex-shrink-0">
            <Spline3DAvatar size="lg" className="avatar-glow" />
          </motion.div>
          <div>
            <motion.h1 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-white to-surface-300 bg-clip-text text-transparent">
              {greetingContext.timeGreeting}{userName ? `, ${userName}` : ''}
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-surface-400 mt-1.5 text-base">
              {greetingContext.subtitle}
            </motion.p>
          </div>
        </div>
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full status-dot-pulse" />
            <span className="text-sm text-emerald-400 font-medium">All systems operational</span>
          </div>
        </motion.div>
      </motion.div>

      {/* AI Agency Card - Your Team of Expert Consultants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-500 to-cyan-500 p-[2px] group">
          <div className="relative bg-surface-900/[0.97] rounded-[calc(1rem-2px)] p-6 md:p-8 backdrop-blur-sm">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    AI Consultancy
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/20">8 Experts</span>
                  </h2>
                  <p className="text-surface-300 text-sm md:text-base max-w-xl">
                    {hasProfile && industryName
                      ? `Your dedicated AI consultancy team, specialized for ${industryName}. Strategy, automation, analytics, compliance, and more.`
                      : 'Your dedicated team of 8 AI expert consultants. Get real strategic advice on automation, analytics, compliance, and business transformation.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-3 flex-shrink-0">
                <Link to="/meeting-room-demo">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all cursor-pointer">
                    <MessageSquare className="w-5 h-5" />
                    <span>Start Session</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Consultant Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
              {consultants.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-800/40 border border-surface-700/30 hover:border-purple-500/30 hover:bg-surface-800/60 transition-all cursor-default"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
                    style={{ backgroundColor: `${agent.color}20`, borderColor: agent.color }}
                  >
                    {agent.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">{agent.displayName}</p>
                    <p className="text-[10px] text-surface-500 leading-tight">{agent.title.split(' — ')[0].split(' + ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Services Row */}
            <div className="pt-5 border-t border-surface-700/30">
              <p className="text-xs text-surface-500 mb-3">Consultancy services:</p>
              <div className="flex flex-wrap gap-2">
                {['AI Strategy', 'Process Automation', 'Data Analytics', 'Compliance & Risk', 'Customer Experience', 'Change Management'].map((service, i) => (
                  <span key={i} className="px-3 py-1.5 text-sm bg-surface-800/60 text-surface-300 rounded-lg border border-surface-700/30">
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Start Row */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link to="/chat" className="flex-1">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-nexus-500/10 border border-nexus-500/20 hover:bg-nexus-500/15 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-nexus-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-nexus-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Build a Workflow</p>
                    <p className="text-xs text-surface-400">Describe it in plain English</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-500 ml-auto" />
                </div>
              </Link>
              <Link to="/meeting-room-demo" className="flex-1">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Consult the Team</p>
                    <p className="text-xs text-surface-400">Get expert advice from 8 AI consultants</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-500 ml-auto" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid - Premium cards with gradient borders */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {stats.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <motion.div
              variants={fadeInUp}
              className={`stat-card-premium ${statColorClass[index]} group cursor-pointer hover:translate-y-[-4px] transition-transform duration-300`}
            >
              <div className="stat-inner">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">{stat.name === 'Time Saved' ? t('dashboard.timeSaved') : stat.name}</p>
                    <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg stat-icon-orb`} style={{ animationDelay: `${index * 0.5}s` }}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
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
          className="lg:col-span-2 section-card section-card-grid"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center section-icon-blue border border-blue-500/10">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('dashboard.recentWorkflows')}</h2>
                <p className="text-xs text-surface-500">Your latest automations</p>
              </div>
            </div>
            <Link to="/workflows" className="text-sm text-nexus-400 hover:text-nexus-300 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-surface-800/50">
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            {isLoadingWorkflows ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/30 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-surface-700/30" />
                    <div className="flex-1">
                      <div className="h-4 bg-surface-700/30 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-surface-700/20 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </>
            ) : recentWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-surface-800 to-surface-800/50 flex items-center justify-center mb-5 border border-surface-700/30">
                  <Zap className="w-9 h-9 text-surface-600" />
                </div>
                <p className="text-surface-300 font-medium mb-1">No workflows yet</p>
                <p className="text-surface-500 text-sm mb-4">Create your first automation to get started</p>
                <Link to="/chat" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-nexus-500/10 text-nexus-400 hover:bg-nexus-500/20 border border-nexus-500/20 transition-all text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  {t('workflow.create')}
                </Link>
              </div>
            ) : (
              recentWorkflows.map((workflow) => (
                <Link key={workflow.id} to="/workflows">
                  <div className="workflow-item flex items-center gap-4 p-4 pl-5 rounded-xl bg-surface-800/20 hover:bg-surface-800/50 border border-transparent hover:border-surface-700/50 transition-all cursor-pointer group">
                    <div className="w-12 h-12 rounded-xl bg-surface-700/30 flex items-center justify-center text-2xl border border-surface-700/20">
                      {workflow.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{workflow.name}</p>
                      <p className="text-sm text-surface-500">{workflow.runs} runs · {workflow.lastRun}</p>
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
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* AI Suggestions - Dramatic Animated Purple Glow Border */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="ai-suggestions-glow">
            <div className="bg-[hsl(222_47%_12%)] rounded-[calc(1rem-2px)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Suggestions</h2>
                  <p className="text-xs text-surface-500">Personalized for you</p>
                </div>
              </div>

              <div className="space-y-3">
                {aiSuggestions.map((suggestion) => {
                  const IconComponent = suggestion.icon
                  return (
                    <Link key={suggestion.id} to="/chat">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 hover:bg-white/[0.05] transition-all cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/10">
                            <IconComponent className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-white text-sm">{suggestion.title}</p>
                              <span className={clsx(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                suggestion.impact === 'High' && 'bg-red-500/15 text-red-400 border border-red-500/20',
                                suggestion.impact === 'Medium' && 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
                                suggestion.impact === 'Low' && 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                              )}>
                                {suggestion.impact}
                              </span>
                            </div>
                            <p className="text-sm text-surface-400 leading-relaxed">{suggestion.description}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <Link to="/chat" className="flex items-center justify-center gap-2 w-full mt-4 py-3 rounded-xl border border-purple-500/20 text-purple-400 hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                View more suggestions
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Achievements section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="section-card section-card-grid"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center section-icon-amber border border-amber-500/10">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Achievements</h2>
              <p className="text-xs text-surface-500">Track your automation milestones</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-800/50 border border-surface-700/30">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm text-surface-400">{earnedCount}<span className="text-surface-600"> / </span>{achievements.length}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <Link key={achievement.id} to="/profile">
              <div
                className={clsx(
                  'relative p-5 rounded-xl border transition-all cursor-pointer h-full hover:translate-y-[-2px] duration-200',
                  achievement.earned
                    ? 'achievement-earned bg-gradient-to-br from-surface-800 to-surface-900 border-amber-500/20 shadow-lg shadow-amber-500/5'
                    : 'glass-card'
                )}
              >
                <div className="relative">
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    achievement.earned
                      ? `bg-gradient-to-br ${achievement.color} shadow-lg`
                      : 'bg-surface-700/30 border border-surface-700/20'
                  )} style={achievement.earned ? { boxShadow: '0 4px 20px rgba(251, 191, 36, 0.15)' } : undefined}>
                    <achievement.icon className={clsx(
                      'w-6 h-6',
                      achievement.earned ? 'text-white' : 'text-surface-500'
                    )} />
                  </div>

                  <h3 className={clsx(
                    'font-semibold mb-1',
                    achievement.earned ? 'text-white' : 'text-surface-300'
                  )}>{achievement.name}</h3>
                  <p className="text-sm text-surface-500 mb-3">{achievement.description}</p>

                  {!achievement.earned && (
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-surface-600">Progress</span>
                        <span className="text-surface-400 font-medium">{achievement.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
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
                    <div className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
                      <Star className="w-4 h-4 fill-current" />
                      <span>Earned!</span>
                    </div>
                  )}
                </div>
              </div>
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
          className="section-card section-card-grid"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-nexus-500/10 flex items-center justify-center section-icon-nexus border border-nexus-500/10">
                <Plus className="w-4 h-4 text-nexus-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Recommended Integrations</h2>
                <p className="text-xs text-surface-500">Connect your favorite apps</p>
              </div>
            </div>
            <Link to="/integrations" className="text-sm text-nexus-400 hover:text-nexus-300 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-surface-800/50">
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {integrationRecommendations.map((integration) => (
              <Link key={integration.toolkit} to={`/integrations?app=${integration.toolkit}`}>
                <div className="integration-card p-5 rounded-xl glass-card cursor-pointer hover:translate-y-[-2px] transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-nexus-500/15 to-accent-500/15 flex items-center justify-center border border-nexus-500/10">
                      <Zap className="w-5 h-5 text-nexus-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{integration.name}</p>
                      <p className="text-xs text-surface-500">{integration.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-400 mb-4 line-clamp-2 leading-relaxed">{integration.reason}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-surface-700/20">
                    <span className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium',
                      integration.priority === 'high' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15',
                      integration.priority === 'medium' && 'bg-amber-500/10 text-amber-400 border border-amber-500/15',
                      integration.priority === 'low' && 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                    )}>
                      {integration.priority} priority
                    </span>
                    <span className="text-xs text-surface-500 font-medium">
                      Saves {integration.estimatedValue}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Customer Dashboard Page
 *
 * Main hub for customers showing:
 * - Welcome message with user name
 * - Stats cards (active workflows, total executions this month, time saved)
 * - Recent workflow runs (last 5)
 * - Quick action buttons (create workflow, view templates, manage integrations)
 * - Usage meter (% of plan limits used)
 * - Subscription status badge
 * - Responsive grid layout
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardStats } from './DashboardStats'
import { ActivityTimeline, EXECUTION_STATUS } from './ActivityTimeline'
import type { WorkflowActivity } from './ActivityTimeline'
import { QuickActionsGrid } from './QuickActionsGrid'

// Plan tier constants
const PLAN_TIER = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const

type PlanTier = typeof PLAN_TIER[keyof typeof PLAN_TIER]

// Types
interface UsageData {
  currentExecutions: number
  maxExecutions: number
  currentWorkflows: number
  maxWorkflows: number
  currentStorage: number
  maxStorage: number
}

interface SubscriptionStatus {
  tier: PlanTier
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  renewsAt?: string
  trialEndsAt?: string
}

// Usage Meter Component
function UsageMeter({ usage, loading }: { usage: UsageData | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 animate-pulse">
        <div className="h-5 w-32 bg-slate-700/50 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-2 bg-slate-700/50 rounded-full" />
          <div className="h-2 bg-slate-700/50 rounded-full" />
        </div>
      </div>
    )
  }

  if (!usage) return null

  const executionPercent = Math.round((usage.currentExecutions / usage.maxExecutions) * 100)
  const workflowPercent = Math.round((usage.currentWorkflows / usage.maxWorkflows) * 100)

  const getProgressColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 75) return 'bg-amber-500'
    return 'bg-cyan-500'
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Usage Overview</h3>
            <p className="text-sm text-slate-400">Current billing period</p>
          </div>
        </div>
        <a
          href="/settings?tab=billing"
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Manage Plan
        </a>
      </div>

      <div className="space-y-4">
        {/* Executions */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Monthly Executions</span>
            <span className="text-white">
              {usage.currentExecutions.toLocaleString()} / {usage.maxExecutions.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(executionPercent)}`}
              style={{ width: `${Math.min(executionPercent, 100)}%` }}
            />
          </div>
          {executionPercent >= 90 && (
            <p className="text-xs text-amber-400 mt-1">
              {executionPercent >= 100 ? 'Limit reached!' : 'Approaching limit'}
            </p>
          )}
        </div>

        {/* Workflows */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Active Workflows</span>
            <span className="text-white">
              {usage.currentWorkflows} / {usage.maxWorkflows}
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(workflowPercent)}`}
              style={{ width: `${Math.min(workflowPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Subscription Status Badge Component
function SubscriptionBadge({ subscription }: { subscription: SubscriptionStatus | null }) {
  if (!subscription) return null

  const tierConfig: Record<PlanTier, { label: string; color: string; bgColor: string }> = {
    [PLAN_TIER.FREE]: {
      label: 'Free',
      color: 'text-slate-300',
      bgColor: 'bg-slate-500/20',
    },
    [PLAN_TIER.PRO]: {
      label: 'Pro',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    [PLAN_TIER.ENTERPRISE]: {
      label: 'Enterprise',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  }

  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    active: { label: 'Active', dotColor: 'bg-emerald-500' },
    trialing: { label: 'Trial', dotColor: 'bg-amber-500' },
    past_due: { label: 'Past Due', dotColor: 'bg-red-500' },
    canceled: { label: 'Canceled', dotColor: 'bg-slate-500' },
  }

  const tierInfo = tierConfig[subscription.tier]
  const statusInfo = statusConfig[subscription.status]

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${tierInfo.bgColor}`}>
      <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
      <span className={`text-sm font-medium ${tierInfo.color}`}>
        {tierInfo.label} {'\u2022'} {statusInfo.label}
      </span>
      {subscription.trialEndsAt && (
        <span className="text-xs text-slate-400 ml-1">
          (ends {new Date(subscription.trialEndsAt).toLocaleDateString()})
        </span>
      )}
    </div>
  )
}

// Welcome Header Component
function WelcomeHeader({
  userName,
  subscription,
}: {
  userName: string
  subscription: SubscriptionStatus | null
}) {
  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
          {getGreeting()}, {userName || 'there'}!
        </h1>
        <p className="text-slate-400">
          Here's what's happening with your workflows today
        </p>
      </div>
      <SubscriptionBadge subscription={subscription} />
    </div>
  )
}

// Sample data generators (replace with real API calls)
function generateSampleActivities(): WorkflowActivity[] {
  const now = new Date()
  return [
    {
      id: '1',
      workflowId: 'wf-001',
      workflowName: 'Email Follow-up Automation',
      status: EXECUTION_STATUS.SUCCESS,
      startedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
      completedAt: new Date(now.getTime() - 14 * 60000).toISOString(),
      duration: 45000,
    },
    {
      id: '2',
      workflowId: 'wf-002',
      workflowName: 'Lead Scoring Pipeline',
      status: EXECUTION_STATUS.RUNNING,
      startedAt: new Date(now.getTime() - 5 * 60000).toISOString(),
    },
    {
      id: '3',
      workflowId: 'wf-003',
      workflowName: 'Document Analysis',
      status: EXECUTION_STATUS.SUCCESS,
      startedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      completedAt: new Date(now.getTime() - 2 * 3600000 + 120000).toISOString(),
      duration: 120000,
    },
    {
      id: '4',
      workflowId: 'wf-004',
      workflowName: 'CRM Data Sync',
      status: EXECUTION_STATUS.FAILED,
      startedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      completedAt: new Date(now.getTime() - 4 * 3600000 + 30000).toISOString(),
      duration: 30000,
      error: 'API rate limit exceeded. Retry scheduled.',
    },
    {
      id: '5',
      workflowId: 'wf-005',
      workflowName: 'Weekly Report Generator',
      status: EXECUTION_STATUS.SUCCESS,
      startedAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      completedAt: new Date(now.getTime() - 24 * 3600000 + 180000).toISOString(),
      duration: 180000,
    },
  ]
}

// Main CustomerDashboard Component
export function CustomerDashboard() {
  const navigate = useNavigate()
  const { user, userProfile, loading: authLoading } = useAuth()

  // State
  const [statsLoading, setStatsLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [usageLoading, setUsageLoading] = useState(true)

  const [stats, setStats] = useState({
    totalWorkflows: 0,
    executionsThisMonth: 0,
    timeSavedMinutes: 0,
    successRate: 0,
  })

  const [activities, setActivities] = useState<WorkflowActivity[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)

  // Get user display name
  const userName = useMemo(() => {
    if (userProfile?.full_name) return userProfile.full_name.split(' ')[0]
    if (user?.user_metadata?.full_name) return (user.user_metadata.full_name as string).split(' ')[0]
    if (user?.email) return user.email.split('@')[0]
    return ''
  }, [user, userProfile])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      // Simulate API calls - replace with real API
      await Promise.all([
        // Fetch stats
        new Promise<void>((resolve) => {
          setTimeout(() => {
            setStats({
              totalWorkflows: 12,
              executionsThisMonth: 247,
              timeSavedMinutes: 890,
              successRate: 94.5,
            })
            setStatsLoading(false)
            resolve()
          }, 800)
        }),

        // Fetch activities
        new Promise<void>((resolve) => {
          setTimeout(() => {
            setActivities(generateSampleActivities())
            setActivitiesLoading(false)
            resolve()
          }, 600)
        }),

        // Fetch usage
        new Promise<void>((resolve) => {
          setTimeout(() => {
            setUsage({
              currentExecutions: 247,
              maxExecutions: 1000,
              currentWorkflows: 12,
              maxWorkflows: 25,
              currentStorage: 256,
              maxStorage: 1024,
            })
            setSubscription({
              tier: PLAN_TIER.PRO,
              status: 'active',
              renewsAt: new Date(Date.now() + 15 * 24 * 3600000).toISOString(),
            })
            setUsageLoading(false)
            resolve()
          }, 700)
        }),
      ])
    } catch (error) {
      console.error('[CustomerDashboard] Error fetching data:', error)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Handle activity click
  const handleActivityClick = useCallback((activity: WorkflowActivity) => {
    navigate(`/workflows/${activity.workflowId}`)
  }, [navigate])

  // Handle quick action click
  const handleQuickActionClick = useCallback((actionId: string) => {
    console.log('[CustomerDashboard] Quick action clicked:', actionId)
    // Analytics tracking could go here
  }, [])

  // Determine if user is on free tier
  const isFreeTier = subscription?.tier === PLAN_TIER.FREE

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <WelcomeHeader
          userName={userName}
          subscription={subscription}
        />

        {/* Stats Section */}
        <section className="mb-8" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
          <DashboardStats
            totalWorkflows={stats.totalWorkflows}
            executionsThisMonth={stats.executionsThisMonth}
            timeSavedMinutes={stats.timeSavedMinutes}
            successRate={stats.successRate}
            loading={statsLoading || authLoading}
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Activity & Usage */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Timeline */}
            <section aria-labelledby="activity-heading">
              <h2 id="activity-heading" className="sr-only">Recent Activity</h2>
              <ActivityTimeline
                activities={activities}
                loading={activitiesLoading}
                maxItems={5}
                onActivityClick={handleActivityClick}
              />
            </section>

            {/* Quick Actions - visible on mobile, hidden on desktop */}
            <div className="lg:hidden">
              <section aria-labelledby="quick-actions-mobile-heading">
                <h2 id="quick-actions-mobile-heading" className="sr-only">Quick Actions</h2>
                <QuickActionsGrid
                  isFreeTier={isFreeTier}
                  onActionClick={handleQuickActionClick}
                />
              </section>
            </div>
          </div>

          {/* Right Column - Quick Actions & Usage */}
          <div className="space-y-6">
            {/* Quick Actions - hidden on mobile, visible on desktop */}
            <div className="hidden lg:block">
              <section aria-labelledby="quick-actions-desktop-heading">
                <h2 id="quick-actions-desktop-heading" className="sr-only">Quick Actions</h2>
                <QuickActionsGrid
                  isFreeTier={isFreeTier}
                  onActionClick={handleQuickActionClick}
                />
              </section>
            </div>

            {/* Usage Meter */}
            <section aria-labelledby="usage-heading">
              <h2 id="usage-heading" className="sr-only">Usage Overview</h2>
              <UsageMeter usage={usage} loading={usageLoading} />
            </section>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-cyan-500/10 via-slate-800/50 to-purple-500/10 rounded-xl border border-cyan-500/20 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Pro Tip</h3>
                  <p className="text-sm text-slate-400">
                    Use templates to quickly create workflows for common tasks like email automation, data sync, and report generation.
                  </p>
                  <button
                    onClick={() => navigate('/templates')}
                    className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    Browse Templates
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CustomerDashboard
